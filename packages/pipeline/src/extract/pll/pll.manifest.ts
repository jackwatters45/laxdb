import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";
import {
  type ExtractionManifest,
  type SeasonManifest,
  type EntityStatus,
  ExtractionManifest as ExtractionManifestSchema,
  createEmptyManifest,
  createEmptySeasonManifest,
} from "../extract.schema";
import { ExtractConfigService } from "../extract.config";

export class PLLManifestService extends Effect.Service<PLLManifestService>()(
  "PLLManifestService",
  {
    effect: Effect.gen(function* () {
      const config = yield* ExtractConfigService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const manifestPath = path.join(config.outputDir, "pll", "manifest.json");

      const load = Effect.gen(function* () {
        const exists = yield* fs.exists(manifestPath);

        if (!exists) {
          return createEmptyManifest("pll");
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
        return yield* Schema.decodeUnknown(ExtractionManifestSchema)(
          parsed,
        ).pipe(
          Effect.catchAll(() => Effect.succeed(createEmptyManifest("pll"))),
        );
      });

      const save = (manifest: ExtractionManifest) =>
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
        manifest: ExtractionManifest,
        year: number,
      ): SeasonManifest => {
        const key = String(year);
        return manifest.seasons[key] ?? createEmptySeasonManifest();
      };

      const updateEntityStatus = (
        manifest: ExtractionManifest,
        year: number,
        entity: keyof SeasonManifest,
        status: EntityStatus,
      ): ExtractionManifest => {
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
        manifest: ExtractionManifest,
        year: number,
        entity: keyof SeasonManifest,
        count: number,
        durationMs: number,
      ): ExtractionManifest => {
        return updateEntityStatus(manifest, year, entity, {
          extracted: true,
          count,
          timestamp: new Date().toISOString(),
          durationMs,
        });
      };

      const isExtracted = (
        manifest: ExtractionManifest,
        year: number,
        entity: keyof SeasonManifest,
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
