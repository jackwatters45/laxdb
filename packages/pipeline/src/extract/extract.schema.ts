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
