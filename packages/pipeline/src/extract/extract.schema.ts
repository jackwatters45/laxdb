import { Effect, Schema } from "effect";

import type { PipelineError } from "../error";

// ============================================================================
// Extract Result Types
// ============================================================================

/**
 * Result of an extraction operation.
 * Contains the extracted data, count, duration, and optional error info.
 */
export interface ExtractResult<T> {
  data: T;
  count: number;
  durationMs: number;
  error?: PipelineError;
}

/**
 * Pipeable helper to create an ExtractResult with timing.
 * Wraps an Effect and tracks execution duration.
 *
 * @example
 * client.getTeams({ year }).pipe(withTiming(), withRateLimitRetry(), Effect.either)
 */
export const withTiming =
  () =>
  <T, E, R>(
    effect: Effect.Effect<T, E, R>,
  ): Effect.Effect<ExtractResult<T>, E, R> =>
    Effect.gen(function* () {
      const start = Date.now();
      const data = yield* effect;
      const durationMs = Date.now() - start;
      const count = Array.isArray(data) ? data.length : 1;
      return { data, count, durationMs };
    });

/**
 * Creates an empty ExtractResult for error cases.
 * Used when extraction fails and we want to continue processing other entities.
 */
export const emptyExtractResult = <T>(emptyData: T): ExtractResult<T> => ({
  data: emptyData,
  count: 0,
  durationMs: 0,
});

// ============================================================================
// Manifest Types
// ============================================================================

export const EntityStatus = Schema.Struct({
  extracted: Schema.Boolean,
  count: Schema.Number,
  timestamp: Schema.String,
  durationMs: Schema.optional(Schema.Number),
});
export type EntityStatus = typeof EntityStatus.Type;

export const SeasonManifest = Schema.Struct({
  teams: EntityStatus,
  teamDetails: EntityStatus,
  players: EntityStatus,
  playerDetails: EntityStatus,
  advancedPlayers: EntityStatus,
  events: EntityStatus,
  eventDetails: EntityStatus,
  standings: EntityStatus,
  standingsCS: EntityStatus,
});
export type SeasonManifest = typeof SeasonManifest.Type;

export const ExtractionManifest = Schema.Struct({
  source: Schema.String,
  seasons: Schema.Record({ key: Schema.String, value: SeasonManifest }),
  lastRun: Schema.String,
  version: Schema.Number,
});
export type ExtractionManifest = typeof ExtractionManifest.Type;

export const createEmptyEntityStatus = (): EntityStatus => ({
  extracted: false,
  count: 0,
  timestamp: "",
});

export const createEmptySeasonManifest = (): SeasonManifest => ({
  teams: createEmptyEntityStatus(),
  teamDetails: createEmptyEntityStatus(),
  players: createEmptyEntityStatus(),
  playerDetails: createEmptyEntityStatus(),
  advancedPlayers: createEmptyEntityStatus(),
  events: createEmptyEntityStatus(),
  eventDetails: createEmptyEntityStatus(),
  standings: createEmptyEntityStatus(),
  standingsCS: createEmptyEntityStatus(),
});

export const createEmptyManifest = (source: string): ExtractionManifest => ({
  source,
  seasons: {},
  lastRun: "",
  version: 1,
});

// ============================================================================
// Staleness Helpers
// ============================================================================

/**
 * Generic entity status interface for staleness checking.
 * Compatible with all manifest entity status types.
 */
export interface EntityStatusLike {
  extracted: boolean;
  timestamp: string;
}

/**
 * Check if an entity status is stale based on max age.
 * Returns true if:
 * - Entity has not been extracted
 * - Timestamp is missing or empty
 * - Age exceeds maxAgeHours
 *
 * If maxAgeHours is null, staleness is never triggered (for historical data).
 */
export const isEntityStale = (
  status: EntityStatusLike | undefined,
  maxAgeHours: number | null,
): boolean => {
  // Not extracted or no status = always stale
  if (!status?.extracted) return true;
  // No timestamp = always stale
  if (!status.timestamp) return true;
  // No max age = never stale (historical data)
  if (maxAgeHours === null) return false;

  const ageMs = Date.now() - new Date(status.timestamp).getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return ageMs > maxAgeMs;
};

// ============================================================================
// Extract Options
// ============================================================================

/**
 * Common options for extraction operations.
 */
export interface ExtractOptions {
  /** Skip entities that have already been extracted. Default: true */
  skipExisting?: boolean;
  /** Maximum age in hours before data is considered stale and re-extracted. Null = never stale. */
  maxAgeHours?: number | null;
}
