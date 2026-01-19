import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";

import { ExtractConfigService } from "../extract.config";

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

// MLLManifestService - manages the MLL extraction manifest
export class MLLManifestService extends Effect.Service<MLLManifestService>()(
  "MLLManifestService",
  {
    effect: Effect.gen(function* () {
      const config = yield* ExtractConfigService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const manifestPath = path.join(config.outputDir, "mll", "manifest.json");

      const load = Effect.gen(function* () {
        const exists = yield* fs.exists(manifestPath);

        if (!exists) {
          return createEmptyMLLManifest();
        }

        const content = yield* fs
          .readFileString(manifestPath, "utf-8")
          .pipe(
            Effect.catchAll((e) =>
              Effect.fail(new Error(`Failed to read manifest: ${String(e)}`)),
            ),
          );

        const parsed = yield* Effect.try({
          try: () => JSON.parse(content) as unknown,
          catch: (e) =>
            new Error(`Failed to parse manifest JSON: ${String(e)}`),
        });
        return yield* Schema.decodeUnknown(MLLExtractionManifest)(parsed).pipe(
          Effect.catchAll(() => Effect.succeed(createEmptyMLLManifest())),
        );
      });

      const save = (manifest: MLLExtractionManifest) =>
        Effect.gen(function* () {
          const dir = path.dirname(manifestPath);
          yield* fs.makeDirectory(dir, { recursive: true });
          const content = JSON.stringify(manifest, null, 2);
          yield* fs.writeFileString(manifestPath, content);
        }).pipe(
          Effect.catchAll((e) =>
            Effect.fail(new Error(`Failed to write manifest: ${String(e)}`)),
          ),
        );

      const getSeasonManifest = (
        manifest: MLLExtractionManifest,
        year: number,
      ): MLLSeasonManifest => {
        const key = String(year);
        return manifest.seasons[key] ?? createEmptyMLLSeasonManifest();
      };

      const updateEntityStatus = (
        manifest: MLLExtractionManifest,
        year: number,
        entity: keyof MLLSeasonManifest,
        status: MLLEntityStatus,
      ): MLLExtractionManifest => {
        const key = String(year);
        const seasonManifest = getSeasonManifest(manifest, year);
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
        manifest: MLLExtractionManifest,
        year: number,
        entity: keyof MLLSeasonManifest,
        count: number,
        durationMs: number,
      ): MLLExtractionManifest => {
        return updateEntityStatus(manifest, year, entity, {
          extracted: true,
          count,
          timestamp: new Date().toISOString(),
          durationMs,
        });
      };

      const isExtracted = (
        manifest: MLLExtractionManifest,
        year: number,
        entity: keyof MLLSeasonManifest,
      ): boolean => {
        const seasonManifest = getSeasonManifest(manifest, year);
        return seasonManifest[entity].extracted;
      };

      return {
        load,
        save,
        getSeasonManifest,
        updateEntityStatus,
        markComplete,
        isExtracted,
      };
    }),
    dependencies: [Layer.merge(ExtractConfigService.Default, BunContext.layer)],
  },
) {}
