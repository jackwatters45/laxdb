import { Schema } from "effect";

// NLL Entity Status - same structure as PLL
export const NLLEntityStatus = Schema.Struct({
  extracted: Schema.Boolean,
  count: Schema.Number,
  timestamp: Schema.String,
  durationMs: Schema.optional(Schema.Number),
});
export type NLLEntityStatus = typeof NLLEntityStatus.Type;

// NLL Season Manifest - NLL has teams, players, standings, schedule
export const NLLSeasonManifest = Schema.Struct({
  teams: NLLEntityStatus,
  players: NLLEntityStatus,
  standings: NLLEntityStatus,
  schedule: NLLEntityStatus,
});
export type NLLSeasonManifest = typeof NLLSeasonManifest.Type;

// Helper to create empty entity status
export const createEmptyNLLEntityStatus = (): NLLEntityStatus => ({
  extracted: false,
  count: 0,
  timestamp: "",
});

// Helper to create empty season manifest
export const createEmptyNLLSeasonManifest = (): NLLSeasonManifest => ({
  teams: createEmptyNLLEntityStatus(),
  players: createEmptyNLLEntityStatus(),
  standings: createEmptyNLLEntityStatus(),
  schedule: createEmptyNLLEntityStatus(),
});
