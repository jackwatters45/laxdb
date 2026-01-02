import { Effect, Schema } from "effect";
import * as fs from "node:fs/promises";
import * as path from "node:path";
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
      const manifestPath = path.join(config.outputDir, "pll", "manifest.json");

      const load = Effect.gen(function* () {
        const exists = yield* Effect.tryPromise({
          try: () =>
            fs
              .access(manifestPath)
              .then(() => true)
              .catch(() => false),
          catch: () => new Error("Unexpected error checking file existence"),
        });

        if (!exists) {
          return createEmptyManifest("pll");
        }

        const content = yield* Effect.tryPromise({
          try: () => fs.readFile(manifestPath, "utf-8"),
          catch: (e) => new Error(`Failed to read manifest: ${String(e)}`),
        });

        const parsed = JSON.parse(content);
        return yield* Schema.decode(ExtractionManifestSchema)(parsed).pipe(
          Effect.catchAll(() => Effect.succeed(createEmptyManifest("pll"))),
        );
      });

      const save = (manifest: ExtractionManifest) =>
        Effect.gen(function* () {
          const dir = path.dirname(manifestPath);
          yield* Effect.tryPromise({
            try: () => fs.mkdir(dir, { recursive: true }),
            catch: (e) => new Error(`Failed to create directory: ${String(e)}`),
          });

          const content = JSON.stringify(manifest, null, 2);
          yield* Effect.tryPromise({
            try: () => fs.writeFile(manifestPath, content),
            catch: (e) => new Error(`Failed to write manifest: ${String(e)}`),
          });
        });

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
    dependencies: [ExtractConfigService.Default],
  },
) {}
