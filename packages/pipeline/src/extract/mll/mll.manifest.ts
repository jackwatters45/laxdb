import { Schema } from "effect";

// MLL Entity Status - same structure as NLL/PLL
export const MLLEntityStatus = Schema.Struct({
  extracted: Schema.Boolean,
  count: Schema.Number,
  timestamp: Schema.String,
  durationMs: Schema.optional(Schema.Number),
});
export type MLLEntityStatus = typeof MLLEntityStatus.Type;

// MLL Season Manifest - MLL has teams, players, goalies, standings, statLeaders, schedule
export const MLLSeasonManifest = Schema.Struct({
  teams: MLLEntityStatus,
  players: MLLEntityStatus,
  goalies: MLLEntityStatus,
  standings: MLLEntityStatus,
  statLeaders: MLLEntityStatus,
  schedule: MLLEntityStatus,
});
export type MLLSeasonManifest = typeof MLLSeasonManifest.Type;

// Helper to create empty entity status
export const createEmptyMLLEntityStatus = (): MLLEntityStatus => ({
  extracted: false,
  count: 0,
  timestamp: "",
});

// Helper to create empty season manifest
export const createEmptyMLLSeasonManifest = (): MLLSeasonManifest => ({
  teams: createEmptyMLLEntityStatus(),
  players: createEmptyMLLEntityStatus(),
  goalies: createEmptyMLLEntityStatus(),
  standings: createEmptyMLLEntityStatus(),
  statLeaders: createEmptyMLLEntityStatus(),
  schedule: createEmptyMLLEntityStatus(),
});

// MLL Extraction Manifest - top-level manifest for MLL data extraction
export const MLLExtractionManifest = Schema.Struct({
  source: Schema.Literal("mll"),
  seasons: Schema.Record({ key: Schema.String, value: MLLSeasonManifest }),
  lastRun: Schema.String,
  version: Schema.Number,
});
export type MLLExtractionManifest = typeof MLLExtractionManifest.Type;

// Helper to create empty MLL manifest
export const createEmptyMLLManifest = (): MLLExtractionManifest => ({
  source: "mll",
  seasons: {},
  lastRun: "",
  version: 1,
});
