import { Effect, Schema } from "effect";

import {
  createEmptyEntityStatus,
  createManifestServiceEffect,
  type EntityStatus,
  EntityStatusSchema,
  type ExtractionManifest,
  ManifestServiceDependencies,
} from "../manifest.factory";

// MSL Season Manifest - MSL has teams, players, goalies, standings, schedule
export const MSLSeasonManifest = Schema.Struct({
  teams: EntityStatusSchema,
  players: EntityStatusSchema,
  goalies: EntityStatusSchema,
  standings: EntityStatusSchema,
  schedule: EntityStatusSchema,
});
export type MSLSeasonManifest = typeof MSLSeasonManifest.Type;

// Helper to create empty season manifest
export const createEmptyMSLSeasonManifest = (): MSLSeasonManifest => ({
  teams: createEmptyEntityStatus(),
  players: createEmptyEntityStatus(),
  goalies: createEmptyEntityStatus(),
  standings: createEmptyEntityStatus(),
  schedule: createEmptyEntityStatus(),
});

// Type aliases for backwards compatibility
export type MSLEntityStatus = EntityStatus;
export type MSLExtractionManifest = ExtractionManifest<
  "msl",
  MSLSeasonManifest
>;

// MSL Manifest Service - uses generic factory
export class MSLManifestService extends Effect.Service<MSLManifestService>()(
  "MSLManifestService",
  {
    effect: createManifestServiceEffect({
      source: "msl",
      seasonManifestSchema: MSLSeasonManifest,
      createEmptySeasonManifest: createEmptyMSLSeasonManifest,
    }),
    dependencies: [ManifestServiceDependencies],
  },
) {}
