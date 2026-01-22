import type { KVNamespace } from "@cloudflare/workers-types";
import { Effect, Layer, Option } from "effect";
import { describe, test, expect, beforeEach, vi } from "vitest";

import {
  CacheService,
  CacheKVBinding,
  CacheKeys,
  getCacheKeyType,
  DEFAULT_TTL_CONFIG,
  getTTLForKeyType,
  SWR_WINDOW_RATIO,
} from "./cache.service";

/**
 * Create a mock KVNamespace for testing.
 * Returns separate mock function references to avoid unbound-method lint errors.
 */
const createMockKV = () => {
  const store = new Map<string, { value: string; expiresAt: number }>();

  // Create mock functions separately to avoid unbound-method issues
  const getMock = vi.fn((key: string) => {
    const entry = store.get(key);
    if (!entry) return Promise.resolve(null);
    // Check expiry
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.value);
  });

  const putMock = vi.fn(
    (key: string, value: string, options?: { expirationTtl?: number }) => {
      const expiresAt = options?.expirationTtl
        ? Date.now() + options.expirationTtl * 1000
        : Date.now() + 60 * 60 * 1000; // Default 1 hour
      store.set(key, { value, expiresAt });
      return Promise.resolve();
    },
  );

  const deleteMock = vi.fn((key: string) => {
    store.delete(key);
    return Promise.resolve();
  });

  const listMock = vi.fn((options?: { prefix?: string }) => {
    const keys: { name: string; expiration?: number; metadata?: unknown }[] =
      [];
    for (const [key, entry] of store.entries()) {
      if (!options?.prefix || key.startsWith(options.prefix)) {
        keys.push({ name: key, expiration: entry.expiresAt });
      }
    }
    return Promise.resolve({ keys, list_complete: true, cacheStatus: null });
  });

  const getWithMetadataMock = vi.fn((key: string) => {
    const entry = store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      return Promise.resolve({ value: null, metadata: null, cacheStatus: null });
    }
    return Promise.resolve({ value: entry.value, metadata: null, cacheStatus: null });
  });

  const kv = {
    get: getMock,
    put: putMock,
    delete: deleteMock,
    list: listMock,
    getWithMetadata: getWithMetadataMock,
  } as unknown as KVNamespace;

  return {
    kv,
    store,
    // Expose mock functions directly for assertions
    getMock,
    putMock,
    deleteMock,
    listMock,
    getWithMetadataMock,
  };
};

describe("CacheService", () => {
  let mockKV: ReturnType<typeof createMockKV>;
  let testLayer: Layer.Layer<CacheService>;

  beforeEach(() => {
    mockKV = createMockKV();
    testLayer = CacheService.Default.pipe(
      Layer.provide(Layer.succeed(CacheKVBinding, mockKV.kv)),
    );
  });

  describe("get", () => {
    test("returns none for missing key", async () => {
      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.get<string>("missing-key");
      }).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(program);
      expect(Option.isNone(result.value)).toBe(true);
      expect(result.isStale).toBe(false);
      expect(result.needsRevalidation).toBe(false);
    });

    test("returns cached value when fresh", async () => {
      // Pre-populate cache
      const metadata = {
        storedAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        staleAt: Date.now() + 48 * 60 * 1000, // 48 min (80% of TTL)
      };
      mockKV.store.set("test-key", {
        value: JSON.stringify({ value: "test-value", metadata }),
        expiresAt: Date.now() + 60 * 60 * 1000,
      });

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.get<string>("test-key");
      }).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(program);
      expect(Option.isSome(result.value)).toBe(true);
      expect(Option.getOrNull(result.value)).toBe("test-value");
      expect(result.isStale).toBe(false);
      expect(result.needsRevalidation).toBe(false);
    });

    test("returns stale value with revalidation flag when in SWR window", async () => {
      // Pre-populate cache with stale entry (past staleAt but before expiresAt)
      const now = Date.now();
      const metadata = {
        storedAt: now - 50 * 60 * 1000, // 50 min ago
        expiresAt: now + 22 * 60 * 1000, // Expires in 22 min (1hr + 20% SWR)
        staleAt: now - 2 * 60 * 1000, // Became stale 2 min ago (48 min mark)
      };
      mockKV.store.set("stale-key", {
        value: JSON.stringify({ value: "stale-value", metadata }),
        expiresAt: now + 22 * 60 * 1000,
      });

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.get<string>("stale-key");
      }).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(program);
      expect(Option.isSome(result.value)).toBe(true);
      expect(Option.getOrNull(result.value)).toBe("stale-value");
      expect(result.isStale).toBe(true);
      expect(result.needsRevalidation).toBe(true);
    });

    test("returns none for expired entry", async () => {
      // Pre-populate cache with expired entry
      const now = Date.now();
      const metadata = {
        storedAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
        expiresAt: now - 48 * 60 * 1000, // Expired 48 min ago
        staleAt: now - 60 * 60 * 1000, // Stale 1 hour ago
      };
      mockKV.store.set("expired-key", {
        value: JSON.stringify({ value: "expired-value", metadata }),
        expiresAt: now + 60 * 60 * 1000, // KV hasn't cleaned up yet
      });

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.get<string>("expired-key");
      }).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(program);
      expect(Option.isNone(result.value)).toBe(true);
    });
  });

  describe("set", () => {
    test("stores value with automatic TTL based on key type", async () => {
      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        yield* cache.set("stats:player:123:all", { goals: 10 });
      }).pipe(Effect.provide(testLayer));

      await Effect.runPromise(program);

      expect(mockKV.putMock).toHaveBeenCalledWith(
        "stats:player:123:all",
        expect.any(String),
        expect.objectContaining({
          expirationTtl: expect.any(Number),
        }),
      );

      // Verify the TTL is correct for player stats (1h + 20% SWR = 72 min = 4320s)
      const expectedTtl = Math.ceil(
        DEFAULT_TTL_CONFIG.playerStatsSeason * (1 + SWR_WINDOW_RATIO),
      );
      expect(mockKV.putMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { expirationTtl: expectedTtl },
      );
    });

    test("uses custom TTL when provided", async () => {
      const customTtl = 300; // 5 minutes

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        yield* cache.set("custom-key", "value", { ttlSeconds: customTtl });
      }).pipe(Effect.provide(testLayer));

      await Effect.runPromise(program);

      const expectedKvTtl = Math.ceil(customTtl * (1 + SWR_WINDOW_RATIO));
      expect(mockKV.putMock).toHaveBeenCalledWith(
        "custom-key",
        expect.any(String),
        { expirationTtl: expectedKvTtl },
      );
    });

    test("uses off-season TTL when specified", async () => {
      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        yield* cache.set("stats:player:123:all", { goals: 10 }, { isActiveSeason: false });
      }).pipe(Effect.provide(testLayer));

      await Effect.runPromise(program);

      // Off-season TTL is 24h + 20% SWR
      const expectedTtl = Math.ceil(
        DEFAULT_TTL_CONFIG.playerStatsOffSeason * (1 + SWR_WINDOW_RATIO),
      );
      expect(mockKV.putMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { expirationTtl: expectedTtl },
      );
    });
  });

  describe("getOrSet", () => {
    test("returns cached value without computing", async () => {
      let computeWasCalled = false;
      const computeEffect = Effect.sync(() => {
        computeWasCalled = true;
        return "computed-value";
      });

      // Pre-populate cache
      const now = Date.now();
      const metadata = {
        storedAt: now,
        expiresAt: now + 60 * 60 * 1000,
        staleAt: now + 48 * 60 * 1000,
      };
      mockKV.store.set("cached-key", {
        value: JSON.stringify({ value: "cached-value", metadata }),
        expiresAt: now + 60 * 60 * 1000,
      });

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.getOrSet("cached-key", computeEffect);
      }).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBe("cached-value");
      expect(computeWasCalled).toBe(false);
    });

    test("computes and stores on cache miss", async () => {
      let computeWasCalled = false;
      const computeEffect = Effect.sync(() => {
        computeWasCalled = true;
        return "computed-value";
      });

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.getOrSet("new-key", computeEffect);
      }).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBe("computed-value");
      expect(computeWasCalled).toBe(true);
      expect(mockKV.putMock).toHaveBeenCalledWith(
        "new-key",
        expect.any(String),
        expect.any(Object),
      );
    });

    test("returns stale value (within SWR window)", async () => {
      const now = Date.now();
      const metadata = {
        storedAt: now - 50 * 60 * 1000,
        expiresAt: now + 22 * 60 * 1000, // Still within full expiry
        staleAt: now - 2 * 60 * 1000, // Past stale time
      };
      mockKV.store.set("stale-key", {
        value: JSON.stringify({ value: "stale-value", metadata }),
        expiresAt: now + 22 * 60 * 1000,
      });

      const computeFn = vi.fn(() => Effect.succeed("fresh-value"));

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.getOrSet("stale-key", computeFn());
      }).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(program);
      // Should return stale value in MVP (proper SWR would trigger background refresh)
      expect(result).toBe("stale-value");
    });

    test("propagates compute errors", async () => {
      const computeError = new Error("compute failed");
      const computeFn = () => Effect.fail(computeError);

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        return yield* cache.getOrSet("error-key", computeFn());
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow("compute failed");
    });
  });

  describe("invalidate", () => {
    test("removes key from cache", async () => {
      mockKV.store.set("to-delete", {
        value: "value",
        expiresAt: Date.now() + 60 * 60 * 1000,
      });

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        yield* cache.invalidate("to-delete");
      }).pipe(Effect.provide(testLayer));

      await Effect.runPromise(program);
      expect(mockKV.deleteMock).toHaveBeenCalledWith("to-delete");
      expect(mockKV.store.has("to-delete")).toBe(false);
    });
  });

  describe("invalidateByPrefix", () => {
    test("removes all keys matching prefix", async () => {
      mockKV.store.set("stats:player:1:all", {
        value: "v1",
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
      mockKV.store.set("stats:player:2:all", {
        value: "v2",
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
      mockKV.store.set("stats:team:1:totals", {
        value: "v3",
        expiresAt: Date.now() + 60 * 60 * 1000,
      });

      const program = Effect.gen(function* () {
        const cache = yield* CacheService;
        yield* cache.invalidateByPrefix("stats:player:");
      }).pipe(Effect.provide(testLayer));

      await Effect.runPromise(program);

      expect(mockKV.listMock).toHaveBeenCalledWith({ prefix: "stats:player:" });
      expect(mockKV.store.has("stats:player:1:all")).toBe(false);
      expect(mockKV.store.has("stats:player:2:all")).toBe(false);
      expect(mockKV.store.has("stats:team:1:totals")).toBe(true);
    });
  });
});

describe("CacheKeys", () => {
  test("playerStats key with season", () => {
    expect(CacheKeys.playerStats(123, 456)).toBe(
      "stats:player:123:season:456",
    );
  });

  test("playerStats key without season", () => {
    expect(CacheKeys.playerStats(123)).toBe("stats:player:123:all");
  });

  test("teamTotals key", () => {
    expect(CacheKeys.teamTotals(123)).toBe("stats:team:123:totals");
  });

  test("teamTotals key with season", () => {
    expect(CacheKeys.teamTotals(123, 456)).toBe(
      "stats:team:123:season:456:totals",
    );
  });

  test("game key", () => {
    expect(CacheKeys.game(789)).toBe("stats:game:789");
  });

  test("identity key", () => {
    expect(CacheKeys.identity(123)).toBe("identity:123");
  });

  test("leaderboard key", () => {
    expect(CacheKeys.leaderboard([1, 2], "points", 2024)).toBe(
      "leaderboard:1,2:points:season:2024",
    );
  });

  test("leaderboard key without season", () => {
    expect(CacheKeys.leaderboard([2, 1], "goals")).toBe(
      "leaderboard:1,2:goals:all", // Note: sorted
    );
  });
});

describe("getCacheKeyType", () => {
  test("identifies player stats keys", () => {
    expect(getCacheKeyType("stats:player:123:all")).toBe("playerStats");
    expect(getCacheKeyType("stats:player:456:season:2024")).toBe("playerStats");
  });

  test("identifies team totals keys", () => {
    expect(getCacheKeyType("stats:team:123:totals")).toBe("teamTotals");
  });

  test("identifies game keys", () => {
    expect(getCacheKeyType("stats:game:789")).toBe("game");
  });

  test("identifies identity keys", () => {
    expect(getCacheKeyType("identity:123")).toBe("identity");
  });

  test("identifies leaderboard keys as teamTotals (same TTL)", () => {
    expect(getCacheKeyType("leaderboard:1,2:points:all")).toBe("teamTotals");
  });

  test("returns unknown for unrecognized keys", () => {
    expect(getCacheKeyType("random:key")).toBe("unknown");
  });
});

describe("getTTLForKeyType", () => {
  test("returns correct TTL for playerStats during season", () => {
    expect(getTTLForKeyType("playerStats", DEFAULT_TTL_CONFIG, true)).toBe(
      DEFAULT_TTL_CONFIG.playerStatsSeason,
    );
  });

  test("returns correct TTL for playerStats off-season", () => {
    expect(getTTLForKeyType("playerStats", DEFAULT_TTL_CONFIG, false)).toBe(
      DEFAULT_TTL_CONFIG.playerStatsOffSeason,
    );
  });

  test("returns correct TTL for teamTotals", () => {
    expect(getTTLForKeyType("teamTotals", DEFAULT_TTL_CONFIG, true)).toBe(
      DEFAULT_TTL_CONFIG.teamTotals,
    );
  });

  test("returns correct TTL for game", () => {
    expect(getTTLForKeyType("game", DEFAULT_TTL_CONFIG, true)).toBe(
      DEFAULT_TTL_CONFIG.game,
    );
  });

  test("returns correct TTL for identity", () => {
    expect(getTTLForKeyType("identity", DEFAULT_TTL_CONFIG, true)).toBe(
      DEFAULT_TTL_CONFIG.identity,
    );
  });

  test("returns default TTL for unknown type", () => {
    expect(getTTLForKeyType("unknown", DEFAULT_TTL_CONFIG, true)).toBe(
      DEFAULT_TTL_CONFIG.default,
    );
  });
});

describe("DEFAULT_TTL_CONFIG", () => {
  test("has correct values per spec", () => {
    expect(DEFAULT_TTL_CONFIG.playerStatsSeason).toBe(60 * 60); // 1 hour
    expect(DEFAULT_TTL_CONFIG.playerStatsOffSeason).toBe(60 * 60 * 24); // 24 hours
    expect(DEFAULT_TTL_CONFIG.teamTotals).toBe(60 * 5); // 5 minutes
    expect(DEFAULT_TTL_CONFIG.game).toBe(60 * 60 * 24); // 24 hours
    expect(DEFAULT_TTL_CONFIG.identity).toBe(60 * 60 * 24 * 7); // 7 days
    expect(DEFAULT_TTL_CONFIG.default).toBe(60 * 60); // 1 hour
  });
});

describe("SWR_WINDOW_RATIO", () => {
  test("is 20% of TTL", () => {
    expect(SWR_WINDOW_RATIO).toBe(0.2);
  });
});
