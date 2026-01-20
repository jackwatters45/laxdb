import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";

import { ExtractConfigService } from "../extract.config";
import { isEntityStale } from "../extract.schema";

// WLA Entity Status - same structure as NLL/MLL/MSL
export const WLAEntityStatus = Schema.Struct({
  extracted: Schema.Boolean,
  count: Schema.Number,
  timestamp: Schema.String,
  durationMs: Schema.optional(Schema.Number),
});
export type WLAEntityStatus = typeof WLAEntityStatus.Type;

// WLA Season Manifest - WLA has teams, players, goalies, standings, schedule
export const WLASeasonManifest = Schema.Struct({
  teams: WLAEntityStatus,
  players: WLAEntityStatus,
  goalies: WLAEntityStatus,
  standings: WLAEntityStatus,
  schedule: WLAEntityStatus,
});
export type WLASeasonManifest = typeof WLASeasonManifest.Type;

// Helper to create empty entity status
export const createEmptyWLAEntityStatus = (): WLAEntityStatus => ({
  extracted: false,
  count: 0,
  timestamp: "",
});

// Helper to create empty season manifest
export const createEmptyWLASeasonManifest = (): WLASeasonManifest => ({
  teams: createEmptyWLAEntityStatus(),
  players: createEmptyWLAEntityStatus(),
  goalies: createEmptyWLAEntityStatus(),
  standings: createEmptyWLAEntityStatus(),
  schedule: createEmptyWLAEntityStatus(),
});

// WLA Extraction Manifest - top-level manifest for WLA data extraction
export const WLAExtractionManifest = Schema.Struct({
  source: Schema.Literal("wla"),
  seasons: Schema.Record({ key: Schema.String, value: WLASeasonManifest }),
  lastRun: Schema.String,
  version: Schema.Number,
});
export type WLAExtractionManifest = typeof WLAExtractionManifest.Type;

// Helper to create empty WLA manifest
export const createEmptyWLAManifest = (): WLAExtractionManifest => ({
  source: "wla",
  seasons: {},
  lastRun: "",
  version: 1,
});

// WLAManifestService - manages the WLA extraction manifest
export class WLAManifestService extends Effect.Service<WLAManifestService>()(
  "WLAManifestService",
  {
    effect: Effect.gen(function* () {
      const config = yield* ExtractConfigService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const manifestPath = path.join(config.outputDir, "wla", "manifest.json");

      const load = Effect.gen(function* () {
        const exists = yield* fs.exists(manifestPath);

        if (!exists) {
          return createEmptyWLAManifest();
        }

        const content = yield* fs
          .readFileString(manifestPath, "utf-8")
          .pipe(
            Effect.catchTag("SystemError", (e) =>
              Effect.fail(new Error(`Failed to read manifest: ${e.message}`)),
            ),
          );

        const parsed = yield* Effect.try({
          try: () => JSON.parse(content) as unknown,
          catch: (e) =>
            new Error(`Failed to parse manifest JSON: ${String(e)}`),
        });
        return yield* Schema.decodeUnknown(WLAExtractionManifest)(parsed).pipe(
          Effect.catchTag("ParseError", (error) =>
            Effect.zipRight(
              Effect.logWarning(
                `WLA manifest schema invalid, creating new: ${error.message}`,
              ),
              Effect.succeed(createEmptyWLAManifest()),
            ),
          ),
        );
      });

      const save = (manifest: WLAExtractionManifest) =>
        Effect.gen(function* () {
          const dir = path.dirname(manifestPath);
          yield* fs.makeDirectory(dir, { recursive: true });
          const content = JSON.stringify(manifest, null, 2);
          yield* fs.writeFileString(manifestPath, content);
        }).pipe(
          Effect.catchTag("SystemError", (e) =>
            Effect.fail(new Error(`Failed to write manifest: ${e.message}`)),
          ),
        );

      const getSeasonManifest = (
        manifest: WLAExtractionManifest,
        seasonId: number,
      ): WLASeasonManifest => {
        const key = String(seasonId);
        return manifest.seasons[key] ?? createEmptyWLASeasonManifest();
      };

      const updateEntityStatus = (
        manifest: WLAExtractionManifest,
        seasonId: number,
        entity: keyof WLASeasonManifest,
        status: WLAEntityStatus,
      ): WLAExtractionManifest => {
        const key = String(seasonId);
        const seasonManifest = getSeasonManifest(manifest, seasonId);
        return {
          ...manifest,
          seasons: {
            ...manifest.seasons,
            [key]: {
              ...seasonManifest,
              [entity]: status,
            },
          },
          lastRun: new Date().toISOString(),
        };
      };

      const markComplete = (
        manifest: WLAExtractionManifest,
        seasonId: number,
        entity: keyof WLASeasonManifest,
        count: number,
        durationMs: number,
      ): WLAExtractionManifest => {
        return updateEntityStatus(manifest, seasonId, entity, {
          extracted: true,
          count,
          timestamp: new Date().toISOString(),
          durationMs,
        });
      };

      const isExtracted = (
        manifest: WLAExtractionManifest,
        seasonId: number,
        entity: keyof WLASeasonManifest,
      ): boolean => {
        const seasonManifest = getSeasonManifest(manifest, seasonId);
        return seasonManifest[entity].extracted;
      };

      /** Check if an entity's data is stale based on max age. */
      const isStale = (
        manifest: WLAExtractionManifest,
        seasonId: number,
        entity: keyof WLASeasonManifest,
        maxAgeHours: number | null,
      ): boolean => {
        const seasonManifest = getSeasonManifest(manifest, seasonId);
        return isEntityStale(seasonManifest[entity], maxAgeHours);
      };

      return {
        load,
        save,
        getSeasonManifest,
        updateEntityStatus,
        markComplete,
        isExtracted,
        isStale,
      };
    }),
    dependencies: [Layer.merge(ExtractConfigService.Default, BunContext.layer)],
  },
) {}
