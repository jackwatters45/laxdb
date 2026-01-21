import { Effect, Schema } from "effect";

import {
  createEmptyEntityStatus,
  createManifestServiceEffect,
  type EntityStatus,
  EntityStatusSchema,
  type ExtractionManifest,
  ManifestServiceDependencies,
} from "../manifest.factory";

// MLL Season Manifest - MLL has teams, players, goalies, standings, statLeaders, schedule
export const MLLSeasonManifest = Schema.Struct({
  teams: EntityStatusSchema,
  players: EntityStatusSchema,
  goalies: EntityStatusSchema,
  standings: EntityStatusSchema,
  statLeaders: EntityStatusSchema,
  schedule: EntityStatusSchema,
});
export type MLLSeasonManifest = typeof MLLSeasonManifest.Type;

// Helper to create empty season manifest
export const createEmptyMLLSeasonManifest = (): MLLSeasonManifest => ({
  teams: createEmptyEntityStatus(),
  players: createEmptyEntityStatus(),
  goalies: createEmptyEntityStatus(),
  standings: createEmptyEntityStatus(),
  statLeaders: createEmptyEntityStatus(),
  schedule: createEmptyEntityStatus(),
});

// Type aliases for backwards compatibility
export type MLLEntityStatus = EntityStatus;
export type MLLExtractionManifest = ExtractionManifest<
  "mll",
  MLLSeasonManifest
>;

// MLL Manifest Service - uses generic factory
export class MLLManifestService extends Effect.Service<MLLManifestService>()(
  "MLLManifestService",
  {
    effect: createManifestServiceEffect({
      source: "mll",
      seasonManifestSchema: MLLSeasonManifest,
      createEmptySeasonManifest: createEmptyMLLSeasonManifest,
    }),
    dependencies: [ManifestServiceDependencies],
  },
) {}
