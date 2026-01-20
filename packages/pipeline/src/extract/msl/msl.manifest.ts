import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";

import { ExtractConfigService } from "../extract.config";
import { isEntityStale } from "../extract.schema";

// MSL Entity Status - same structure as NLL/MLL
export const MSLEntityStatus = Schema.Struct({
  extracted: Schema.Boolean,
  count: Schema.Number,
  timestamp: Schema.String,
  durationMs: Schema.optional(Schema.Number),
});
export type MSLEntityStatus = typeof MSLEntityStatus.Type;

// MSL Season Manifest - MSL has teams, players, goalies, standings, schedule
export const MSLSeasonManifest = Schema.Struct({
  teams: MSLEntityStatus,
  players: MSLEntityStatus,
  goalies: MSLEntityStatus,
  standings: MSLEntityStatus,
  schedule: MSLEntityStatus,
});
export type MSLSeasonManifest = typeof MSLSeasonManifest.Type;

// Helper to create empty entity status
export const createEmptyMSLEntityStatus = (): MSLEntityStatus => ({
  extracted: false,
  count: 0,
  timestamp: "",
});

// Helper to create empty season manifest
export const createEmptyMSLSeasonManifest = (): MSLSeasonManifest => ({
  teams: createEmptyMSLEntityStatus(),
  players: createEmptyMSLEntityStatus(),
  goalies: createEmptyMSLEntityStatus(),
  standings: createEmptyMSLEntityStatus(),
  schedule: createEmptyMSLEntityStatus(),
});

// MSL Extraction Manifest - top-level manifest for MSL data extraction
export const MSLExtractionManifest = Schema.Struct({
  source: Schema.Literal("msl"),
  seasons: Schema.Record({ key: Schema.String, value: MSLSeasonManifest }),
  lastRun: Schema.String,
  version: Schema.Number,
});
export type MSLExtractionManifest = typeof MSLExtractionManifest.Type;

// Helper to create empty MSL manifest
export const createEmptyMSLManifest = (): MSLExtractionManifest => ({
  source: "msl",
  seasons: {},
  lastRun: "",
  version: 1,
});

// MSLManifestService - manages the MSL extraction manifest
export class MSLManifestService extends Effect.Service<MSLManifestService>()(
  "MSLManifestService",
  {
    effect: Effect.gen(function* () {
      const config = yield* ExtractConfigService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const manifestPath = path.join(config.outputDir, "msl", "manifest.json");

      const load = Effect.gen(function* () {
        const exists = yield* fs.exists(manifestPath);

        if (!exists) {
          return createEmptyMSLManifest();
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
        return yield* Schema.decodeUnknown(MSLExtractionManifest)(parsed).pipe(
          Effect.catchTag("ParseError", (error) =>
            Effect.zipRight(
              Effect.logWarning(
                `MSL manifest schema invalid, creating new: ${error.message}`,
              ),
              Effect.succeed(createEmptyMSLManifest()),
            ),
          ),
        );
      });

      const save = (manifest: MSLExtractionManifest) =>
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
        manifest: MSLExtractionManifest,
        seasonId: number,
      ): MSLSeasonManifest => {
        const key = String(seasonId);
        return manifest.seasons[key] ?? createEmptyMSLSeasonManifest();
      };

      const updateEntityStatus = (
        manifest: MSLExtractionManifest,
        seasonId: number,
        entity: keyof MSLSeasonManifest,
        status: MSLEntityStatus,
      ): MSLExtractionManifest => {
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
        manifest: MSLExtractionManifest,
        seasonId: number,
        entity: keyof MSLSeasonManifest,
        count: number,
        durationMs: number,
      ): MSLExtractionManifest => {
        return updateEntityStatus(manifest, seasonId, entity, {
          extracted: true,
          count,
          timestamp: new Date().toISOString(),
          durationMs,
        });
      };

      const isExtracted = (
        manifest: MSLExtractionManifest,
        seasonId: number,
        entity: keyof MSLSeasonManifest,
      ): boolean => {
        const seasonManifest = getSeasonManifest(manifest, seasonId);
        return seasonManifest[entity].extracted;
      };

      /** Check if an entity's data is stale based on max age. */
      const isStale = (
        manifest: MSLExtractionManifest,
        seasonId: number,
        entity: keyof MSLSeasonManifest,
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
