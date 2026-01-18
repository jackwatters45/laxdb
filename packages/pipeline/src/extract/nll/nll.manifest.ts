import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";

import { ExtractConfigService } from "../extract.config";

// NLL Entity Status - same structure as PLL
export const NLLEntityStatus = Schema.Struct({
  extracted: Schema.Boolean,
  count: Schema.Number,
  timestamp: Schema.String,
  durationMs: Schema.optional(Schema.Number),
});
export type NLLEntityStatus = typeof NLLEntityStatus.Type;

// NLL Season Manifest - NLL has teams, players, standings, schedule, playerStats
export const NLLSeasonManifest = Schema.Struct({
  teams: NLLEntityStatus,
  players: NLLEntityStatus,
  standings: NLLEntityStatus,
  schedule: NLLEntityStatus,
  playerStats: Schema.optional(NLLEntityStatus),
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
  playerStats: createEmptyNLLEntityStatus(),
});

// NLL Extraction Manifest - top-level manifest structure
export const NLLExtractionManifest = Schema.Struct({
  source: Schema.Literal("nll"),
  seasons: Schema.Record({ key: Schema.String, value: NLLSeasonManifest }),
  lastRun: Schema.String,
  version: Schema.Number,
});
export type NLLExtractionManifest = typeof NLLExtractionManifest.Type;

// Helper to create empty NLL manifest
export const createEmptyNLLManifest = (): NLLExtractionManifest => ({
  source: "nll",
  seasons: {},
  lastRun: "",
  version: 1,
});

// NLL Manifest Service
export class NLLManifestService extends Effect.Service<NLLManifestService>()(
  "NLLManifestService",
  {
    effect: Effect.gen(function* () {
      const config = yield* ExtractConfigService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const manifestPath = path.join(config.outputDir, "nll", "manifest.json");

      const load = Effect.gen(function* () {
        const exists = yield* fs.exists(manifestPath);

        if (!exists) {
          return createEmptyNLLManifest();
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
        return yield* Schema.decodeUnknown(NLLExtractionManifest)(parsed).pipe(
          Effect.catchAll(() => Effect.succeed(createEmptyNLLManifest())),
        );
      });

      const save = (manifest: NLLExtractionManifest) =>
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
        manifest: NLLExtractionManifest,
        seasonId: number,
      ): NLLSeasonManifest => {
        const key = String(seasonId);
        return manifest.seasons[key] ?? createEmptyNLLSeasonManifest();
      };

      const markComplete = (
        manifest: NLLExtractionManifest,
        seasonId: number,
        entity: keyof NLLSeasonManifest,
        count: number,
        durationMs: number,
      ): NLLExtractionManifest => {
        const key = String(seasonId);
        const seasonManifest = getSeasonManifest(manifest, seasonId);
        return {
          ...manifest,
          seasons: {
            ...manifest.seasons,
            [key]: {
              ...seasonManifest,
              [entity]: {
                extracted: true,
                count,
                timestamp: new Date().toISOString(),
                durationMs,
              } satisfies NLLEntityStatus,
            },
          },
          lastRun: new Date().toISOString(),
        };
      };

      const isExtracted = (
        manifest: NLLExtractionManifest,
        seasonId: number,
        entity: keyof NLLSeasonManifest,
      ): boolean => {
        const seasonManifest = getSeasonManifest(manifest, seasonId);
        const entityStatus = seasonManifest[entity];
        return entityStatus?.extracted ?? false;
      };

      return {
        load,
        save,
        getSeasonManifest,
        markComplete,
        isExtracted,
      };
    }),
    dependencies: [Layer.merge(ExtractConfigService.Default, BunContext.layer)],
  },
) {}
