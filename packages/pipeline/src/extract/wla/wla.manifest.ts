import { Effect, Schema } from "effect";

import {
  createEmptyEntityStatus,
  createManifestServiceEffect,
  type EntityStatus,
  EntityStatusSchema,
  type ExtractionManifest,
  ManifestServiceDependencies,
} from "../manifest.factory";

// WLA Season Manifest - WLA has teams, players, goalies, standings, schedule
export const WLASeasonManifest = Schema.Struct({
  teams: EntityStatusSchema,
  players: EntityStatusSchema,
  goalies: EntityStatusSchema,
  standings: EntityStatusSchema,
  schedule: EntityStatusSchema,
});
export type WLASeasonManifest = typeof WLASeasonManifest.Type;

// Helper to create empty season manifest
export const createEmptyWLASeasonManifest = (): WLASeasonManifest => ({
  teams: createEmptyEntityStatus(),
  players: createEmptyEntityStatus(),
  goalies: createEmptyEntityStatus(),
  standings: createEmptyEntityStatus(),
  schedule: createEmptyEntityStatus(),
});

// Type aliases for backwards compatibility
export type WLAEntityStatus = EntityStatus;
export type WLAExtractionManifest = ExtractionManifest<
  "wla",
  WLASeasonManifest
>;

// WLA Manifest Service - uses generic factory
export class WLAManifestService extends Effect.Service<WLAManifestService>()(
  "WLAManifestService",
  {
    effect: createManifestServiceEffect({
      source: "wla",
      seasonManifestSchema: WLASeasonManifest,
      createEmptySeasonManifest: createEmptyWLASeasonManifest,
    }),
    dependencies: [ManifestServiceDependencies],
  },
) {}
