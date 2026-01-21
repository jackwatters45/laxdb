import { Effect, Schema } from "effect";

import {
  createEmptyEntityStatus,
  createManifestServiceEffect,
  type EntityStatus,
  EntityStatusSchema,
  type ExtractionManifest,
  ManifestServiceDependencies,
} from "../manifest.factory";

// NLL Season Manifest - NLL has teams, players, standings, schedule, playerStats
export const NLLSeasonManifest = Schema.Struct({
  teams: EntityStatusSchema,
  players: EntityStatusSchema,
  standings: EntityStatusSchema,
  schedule: EntityStatusSchema,
  playerStats: EntityStatusSchema,
});
export type NLLSeasonManifest = typeof NLLSeasonManifest.Type;

// Helper to create empty season manifest
export const createEmptyNLLSeasonManifest = (): NLLSeasonManifest => ({
  teams: createEmptyEntityStatus(),
  players: createEmptyEntityStatus(),
  standings: createEmptyEntityStatus(),
  schedule: createEmptyEntityStatus(),
  playerStats: createEmptyEntityStatus(),
});

// Type aliases for backwards compatibility
export type NLLEntityStatus = EntityStatus;
export type NLLExtractionManifest = ExtractionManifest<
  "nll",
  NLLSeasonManifest
>;

// NLL Manifest Service - uses generic factory
export class NLLManifestService extends Effect.Service<NLLManifestService>()(
  "NLLManifestService",
  {
    effect: createManifestServiceEffect({
      source: "nll",
      seasonManifestSchema: NLLSeasonManifest,
      createEmptySeasonManifest: createEmptyNLLSeasonManifest,
    }),
    dependencies: [ManifestServiceDependencies],
  },
) {}
