import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";

import { ExtractConfigService } from "../extract.config";
import {
  type ExtractionManifest,
  type SeasonManifest,
  type EntityStatus,
  ExtractionManifest as ExtractionManifestSchema,
  createEmptyManifest,
  createEmptySeasonManifest,
  isEntityStale,
} from "../extract.schema";

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
            Effect.catchTag("SystemError", (e) =>
              Effect.fail(new Error(`Failed to read manifest: ${e.message}`)),
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
          Effect.catchTag("ParseError", (error) =>
            Effect.zipRight(
              Effect.logWarning(
                `PLL manifest schema invalid, creating new: ${error.message}`,
              ),
              Effect.succeed(createEmptyManifest("pll")),
            ),
          ),
        );
      });

      const save = (manifest: ExtractionManifest) =>
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

      /** Check if an entity's data is stale based on max age. */
      const isStale = (
        manifest: ExtractionManifest,
        year: number,
        entity: keyof SeasonManifest,
        maxAgeHours: number | null,
      ): boolean => {
        const seasonManifest = getSeasonManifest(manifest, year);
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
