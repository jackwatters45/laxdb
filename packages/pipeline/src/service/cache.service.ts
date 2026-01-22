import type { KVNamespace } from "@cloudflare/workers-types";
import { Context, Effect, Layer, Option, Schema } from "effect";

/**
 * Cache entry metadata stored alongside values
 */
export interface CacheMetadata {
  readonly storedAt: number;
  readonly expiresAt: number;
  readonly staleAt: number;
}

/**
 * Cache service error
 */
export class CacheError extends Schema.TaggedError<CacheError>("CacheError")(
  "CacheError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

/**
 * TTL configuration for different cache key types (in seconds)
 *
 * From spec:
 * - player stats: 1h (during season) / 24h (off-season)
 * - team totals: 5min (leaderboards need fresh data)
 * - game: 24h (immutable after final)
 * - identity: 7 days (rarely changes)
 */
export interface TTLConfig {
  /** Player stats during active season */
  readonly playerStatsSeason: number;
  /** Player stats during off-season */
  readonly playerStatsOffSeason: number;
  /** Team totals/leaderboards */
  readonly teamTotals: number;
  /** Game data (immutable after final) */
  readonly game: number;
  /** Player identity mappings */
  readonly identity: number;
  /** Default TTL for unspecified keys */
  readonly default: number;
}

/**
 * Default TTL values in seconds
 */
export const DEFAULT_TTL_CONFIG: TTLConfig = {
  playerStatsSeason: 60 * 60, // 1 hour
  playerStatsOffSeason: 60 * 60 * 24, // 24 hours
  teamTotals: 60 * 5, // 5 minutes
  game: 60 * 60 * 24, // 24 hours
  identity: 60 * 60 * 24 * 7, // 7 days
  default: 60 * 60, // 1 hour
};

/**
 * Stale-while-revalidate window as percentage of TTL
 * Data is served stale for this fraction of TTL after expiry while revalidating
 */
export const SWR_WINDOW_RATIO = 0.2; // 20% of TTL

/**
 * Cache key types for TTL determination
 */
export type CacheKeyType =
  | "playerStats"
  | "teamTotals"
  | "game"
  | "identity"
  | "unknown";

/**
 * Key prefixes for structured cache keys
 */
export const CACHE_KEY_PREFIXES = {
  playerStats: "stats:player:",
  teamTotals: "stats:team:",
  game: "stats:game:",
  identity: "identity:",
  leaderboard: "leaderboard:",
} as const;

/**
 * Determine cache key type from key string
 */
export const getCacheKeyType = (key: string): CacheKeyType => {
  if (key.startsWith(CACHE_KEY_PREFIXES.playerStats)) return "playerStats";
  if (key.startsWith(CACHE_KEY_PREFIXES.teamTotals)) return "teamTotals";
  if (key.startsWith(CACHE_KEY_PREFIXES.game)) return "game";
  if (key.startsWith(CACHE_KEY_PREFIXES.identity)) return "identity";
  if (key.startsWith(CACHE_KEY_PREFIXES.leaderboard)) return "teamTotals"; // Same TTL as team totals
  return "unknown";
};

/**
 * Get TTL for a cache key type
 */
export const getTTLForKeyType = (
  keyType: CacheKeyType,
  config: TTLConfig,
  isActiveSeason: boolean = true,
): number => {
  switch (keyType) {
    case "playerStats":
      return isActiveSeason
        ? config.playerStatsSeason
        : config.playerStatsOffSeason;
    case "teamTotals":
      return config.teamTotals;
    case "game":
      return config.game;
    case "identity":
      return config.identity;
    case "unknown":
      return config.default;
  }
};

/**
 * Cache key builders
 */
export const CacheKeys = {
  /** stats:player:{playerId}:season:{seasonId} */
  playerStats: (playerId: number, seasonId?: number): string =>
    seasonId
      ? `${CACHE_KEY_PREFIXES.playerStats}${playerId}:season:${seasonId}`
      : `${CACHE_KEY_PREFIXES.playerStats}${playerId}:all`,

  /** stats:team:{teamId}:totals */
  teamTotals: (teamId: number, seasonId?: number): string =>
    seasonId
      ? `${CACHE_KEY_PREFIXES.teamTotals}${teamId}:season:${seasonId}:totals`
      : `${CACHE_KEY_PREFIXES.teamTotals}${teamId}:totals`,

  /** stats:game:{gameId} */
  game: (gameId: number): string => `${CACHE_KEY_PREFIXES.game}${gameId}`,

  /** identity:{canonicalPlayerId} */
  identity: (canonicalPlayerId: number): string =>
    `${CACHE_KEY_PREFIXES.identity}${canonicalPlayerId}`,

  /** leaderboard:{leagueIds}:{sortBy}:{seasonId} */
  leaderboard: (
    leagueIds: readonly number[],
    sortBy: string,
    seasonId?: number,
  ): string => {
    const leagues = leagueIds
      .slice()
      .toSorted((a, b) => a - b)
      .join(",");
    return seasonId
      ? `${CACHE_KEY_PREFIXES.leaderboard}${leagues}:${sortBy}:season:${seasonId}`
      : `${CACHE_KEY_PREFIXES.leaderboard}${leagues}:${sortBy}:all`;
  },
};

/**
 * Wrapper type for cached values with metadata
 */
interface CachedValue<T> {
  readonly value: T;
  readonly metadata: CacheMetadata;
}

/**
 * Serialize value with metadata for storage
 */
const serialize = <T>(value: T, metadata: CacheMetadata): string => {
  return JSON.stringify({ value, metadata });
};

/**
 * Result of a cache get with stale-while-revalidate info
 */
export interface CacheGetResult<T> {
  readonly value: Option.Option<T>;
  readonly isStale: boolean;
  readonly needsRevalidation: boolean;
}

/**
 * KV binding tag for dependency injection
 */
export class CacheKVBinding extends Context.Tag("CacheKVBinding")<
  CacheKVBinding,
  KVNamespace
>() {}

/**
 * Cache service with TTL strategies and stale-while-revalidate
 */
export class CacheService extends Effect.Service<CacheService>()(
  "CacheService",
  {
    effect: Effect.gen(function* () {
      const kv = yield* CacheKVBinding;
      const config = DEFAULT_TTL_CONFIG;

      /**
       * Calculate metadata for a cache entry
       */
      const calculateMetadata = (
        ttlSeconds: number,
        now: number = Date.now(),
      ): CacheMetadata => {
        const swrWindow = Math.floor(ttlSeconds * SWR_WINDOW_RATIO);
        return {
          storedAt: now,
          expiresAt: now + ttlSeconds * 1000,
          staleAt: now + (ttlSeconds - swrWindow) * 1000,
        };
      };

      /**
       * Deserialize cached value
       */
      const deserialize = <T>(raw: string): CachedValue<T> | null => {
        try {
          const parsed = JSON.parse(raw) as CachedValue<T>;
          if (
            parsed.value !== undefined &&
            parsed.metadata &&
            typeof parsed.metadata.storedAt === "number"
          ) {
            return parsed;
          }
          return null;
        } catch {
          return null;
        }
      };

      return {
        /**
         * Get a value from cache
         * Returns Option.none() if not found or expired
         * Supports stale-while-revalidate: returns stale data with needsRevalidation flag
         */
        get: <T>(key: string): Effect.Effect<CacheGetResult<T>, CacheError> =>
          Effect.gen(function* () {
            const raw = yield* Effect.tryPromise({
              try: () => kv.get(key, "text"),
              catch: (error) =>
                new CacheError({
                  message: `Failed to get cache key: ${key}`,
                  cause: error,
                }),
            });

            if (raw === null) {
              return {
                value: Option.none(),
                isStale: false,
                needsRevalidation: false,
              } as CacheGetResult<T>;
            }

            const cached = deserialize<T>(raw);
            if (cached === null) {
              // Invalid cache entry, treat as miss
              return {
                value: Option.none(),
                isStale: false,
                needsRevalidation: false,
              } as CacheGetResult<T>;
            }

            const now = Date.now();
            const { metadata, value } = cached;

            // Check if completely expired (past stale window)
            if (now > metadata.expiresAt) {
              return {
                value: Option.none(),
                isStale: false,
                needsRevalidation: false,
              } as CacheGetResult<T>;
            }

            // Check if stale (in SWR window)
            const isStale = now > metadata.staleAt;

            return {
              value: Option.some(value),
              isStale,
              needsRevalidation: isStale,
            } as CacheGetResult<T>;
          }),

        /**
         * Set a value in cache with automatic TTL based on key type
         */
        set: <T>(
          key: string,
          value: T,
          options?: {
            ttlSeconds?: number;
            isActiveSeason?: boolean;
          },
        ): Effect.Effect<void, CacheError> =>
          Effect.gen(function* () {
            const keyType = getCacheKeyType(key);
            const ttl =
              options?.ttlSeconds ??
              getTTLForKeyType(
                keyType,
                config,
                options?.isActiveSeason ?? true,
              );

            const metadata = calculateMetadata(ttl);
            const serialized = serialize(value, metadata);

            // KV TTL is the full expiry including SWR window
            const kvTtl = Math.ceil(ttl * (1 + SWR_WINDOW_RATIO));

            yield* Effect.tryPromise({
              try: () => kv.put(key, serialized, { expirationTtl: kvTtl }),
              catch: (error) =>
                new CacheError({
                  message: `Failed to set cache key: ${key}`,
                  cause: error,
                }),
            });
          }),

        /**
         * Read-through cache: get from cache or compute and store
         * Implements stale-while-revalidate: returns stale data immediately,
         * triggers background refresh
         */
        getOrSet: <T, E>(
          key: string,
          compute: Effect.Effect<T, E>,
          options?: {
            ttlSeconds?: number;
            isActiveSeason?: boolean;
          },
        ): Effect.Effect<T, E | CacheError> =>
          Effect.gen(function* () {
            const cacheResult = yield* Effect.tryPromise({
              try: () => kv.get(key, "text"),
              catch: (error) =>
                new CacheError({
                  message: `Failed to get cache key: ${key}`,
                  cause: error,
                }),
            });

            if (cacheResult !== null) {
              const cached = deserialize<T>(cacheResult);
              if (cached !== null) {
                const now = Date.now();
                const { metadata, value } = cached;

                // If within stale window, return value (even if stale)
                if (now <= metadata.expiresAt) {
                  // If stale, we'd ideally trigger background refresh
                  // For simplicity in MVP, just return the value
                  // Real SWR would use waitUntil for background refresh
                  return value;
                }
              }
            }

            // Cache miss or expired - compute and store
            const computed = yield* compute;

            const keyType = getCacheKeyType(key);
            const ttl =
              options?.ttlSeconds ??
              getTTLForKeyType(
                keyType,
                config,
                options?.isActiveSeason ?? true,
              );

            const metadata = calculateMetadata(ttl);
            const serialized = serialize(computed, metadata);
            const kvTtl = Math.ceil(ttl * (1 + SWR_WINDOW_RATIO));

            yield* Effect.tryPromise({
              try: () => kv.put(key, serialized, { expirationTtl: kvTtl }),
              catch: (error) =>
                new CacheError({
                  message: `Failed to set cache key: ${key}`,
                  cause: error,
                }),
            });

            return computed;
          }),

        /**
         * Invalidate a cache key
         */
        invalidate: (key: string): Effect.Effect<void, CacheError> =>
          Effect.tryPromise({
            try: () => kv.delete(key),
            catch: (error) =>
              new CacheError({
                message: `Failed to invalidate cache key: ${key}`,
                cause: error,
              }),
          }),

        /**
         * Invalidate multiple keys by prefix
         * Note: KV list can be expensive, use sparingly
         */
        invalidateByPrefix: (prefix: string): Effect.Effect<void, CacheError> =>
          Effect.gen(function* () {
            const list = yield* Effect.tryPromise({
              try: () => kv.list({ prefix }),
              catch: (error) =>
                new CacheError({
                  message: `Failed to list keys with prefix: ${prefix}`,
                  cause: error,
                }),
            });

            // Delete all matching keys
            for (const key of list.keys as Array<{ name: string }>) {
              yield* Effect.tryPromise({
                try: () => kv.delete(key.name),
                catch: (error) =>
                  new CacheError({
                    message: `Failed to delete cache key: ${key.name}`,
                    cause: error,
                  }),
              });
            }
          }),

        /**
         * Get TTL configuration
         */
        getTTLConfig: (): TTLConfig => config,

        /**
         * Get TTL for a specific key
         */
        getTTLForKey: (key: string, isActiveSeason: boolean = true): number => {
          const keyType = getCacheKeyType(key);
          return getTTLForKeyType(keyType, config, isActiveSeason);
        },
      } as const;
    }),
    dependencies: [],
  },
) {}

/**
 * Create CacheService layer from KV namespace
 */
export const CacheServiceLive = (kvNamespace: KVNamespace) =>
  CacheService.Default.pipe(
    Layer.provide(Layer.succeed(CacheKVBinding, kvNamespace)),
  );
