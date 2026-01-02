import { Schema } from "effect";

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
