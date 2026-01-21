/**
 * Generic ManifestService factory to eliminate duplication across league manifests.
 *
 * Each league has the same manifest operations but with different season manifest schemas.
 * This factory creates a manifest service given the source name and empty season manifest creator.
 */

import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Console, Effect, Layer, Schema } from "effect";

import { ExtractConfigService } from "./extract.config";
import { isEntityStale } from "./extract.schema";

/** Entity status schema - same for all leagues */
export const EntityStatusSchema = Schema.Struct({
  extracted: Schema.Boolean,
  count: Schema.Number,
  timestamp: Schema.String,
  durationMs: Schema.optional(Schema.Number),
});
export type EntityStatus = typeof EntityStatusSchema.Type;

/** Create an empty entity status */
export const createEmptyEntityStatus = (): EntityStatus => ({
  extracted: false,
  count: 0,
  timestamp: "",
});

/** Configuration for creating a manifest service */
export interface ManifestServiceConfig<
  TSource extends string,
  TSeasonManifest extends Record<string, EntityStatus>,
> {
  /** Source name (e.g., "nll", "pll") */
  source: TSource;
  /** Schema for validating the season manifest */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seasonManifestSchema: Schema.Schema<TSeasonManifest, any>;
  /** Function to create an empty season manifest */
  createEmptySeasonManifest: () => TSeasonManifest;
}

/** Generic extraction manifest type */
export interface ExtractionManifest<
  TSource extends string,
  TSeasonManifest extends Record<string, EntityStatus>,
> {
  source: TSource;
  seasons: Record<string, TSeasonManifest>;
  lastRun: string;
  version: number;
}

/** Create a manifest service effect for a specific source */
export const createManifestServiceEffect = <
  TSource extends string,
  TSeasonManifest extends Record<string, EntityStatus>,
>(
  config: ManifestServiceConfig<TSource, TSeasonManifest>,
) => {
  type Manifest = ExtractionManifest<TSource, TSeasonManifest>;

  const createEmptyManifest = (): Manifest => ({
    source: config.source,
    seasons: {},
    lastRun: "",
    version: 1,
  });

  // Create extraction manifest schema dynamically
  const ExtractionManifestSchema = Schema.Struct({
    source: Schema.Literal(config.source),
    seasons: Schema.Record({
      key: Schema.String,
      value: config.seasonManifestSchema,
    }),
    lastRun: Schema.String,
    version: Schema.Number,
  });

  return Effect.gen(function* () {
    const extractConfig = yield* ExtractConfigService;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const manifestPath = path.join(
      extractConfig.outputDir,
      config.source,
      "manifest.json",
    );

    const load = Effect.gen(function* () {
      const exists = yield* fs.exists(manifestPath);

      if (!exists) {
        return createEmptyManifest();
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
        catch: (e) => new Error(`Failed to parse manifest JSON: ${String(e)}`),
      });

      return yield* Schema.decodeUnknown(ExtractionManifestSchema)(parsed).pipe(
        Effect.catchTag("ParseError", (error) =>
          Effect.zipRight(
            Effect.logWarning(
              `${config.source.toUpperCase()} manifest schema invalid, creating new: ${error.message}`,
            ),
            Effect.succeed(createEmptyManifest()),
          ),
        ),
      );
    });

    const save = (manifest: Manifest) =>
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
      manifest: Manifest,
      seasonId: number,
    ): TSeasonManifest => {
      const key = String(seasonId);
      return manifest.seasons[key] ?? config.createEmptySeasonManifest();
    };

    const markComplete = (
      manifest: Manifest,
      seasonId: number,
      entity: keyof TSeasonManifest,
      count: number,
      durationMs: number,
    ): Manifest => {
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
            } satisfies EntityStatus,
          },
        },
        lastRun: new Date().toISOString(),
      };
    };

    const isExtracted = (
      manifest: Manifest,
      seasonId: number,
      entity: keyof TSeasonManifest,
    ): boolean => {
      const seasonManifest = getSeasonManifest(manifest, seasonId);
      const entityStatus = seasonManifest[entity];
      return entityStatus?.extracted ?? false;
    };

    const isStale = (
      manifest: Manifest,
      seasonId: number,
      entity: keyof TSeasonManifest,
      maxAgeHours: number | null,
    ): boolean => {
      const seasonManifest = getSeasonManifest(manifest, seasonId);
      return isEntityStale(seasonManifest[entity], maxAgeHours);
    };

    const displayStatus = (
      manifest: Manifest,
      json: boolean,
      seasonLabel = "Season",
    ) =>
      Effect.gen(function* () {
        if (json) {
          yield* Console.log(JSON.stringify(manifest, null, 2));
        } else {
          yield* Console.log(
            `${config.source.toUpperCase()} Extraction Status (last run: ${manifest.lastRun || "never"})`,
          );
          for (const [seasonId, seasonManifest] of Object.entries(
            manifest.seasons,
          )) {
            yield* Console.log(`\n${seasonLabel} ${seasonId}:`);
            for (const [entity, entityStatus] of Object.entries(
              seasonManifest,
            )) {
              const st = entityStatus?.extracted
                ? `✓ ${entityStatus.count} items`
                : "✗ not extracted";
              yield* Console.log(`  ${entity}: ${st}`);
            }
          }
        }
      });

    return {
      load,
      save,
      getSeasonManifest,
      markComplete,
      isExtracted,
      isStale,
      displayStatus,
    };
  });
};

/** Default dependencies for manifest services */
export const ManifestServiceDependencies = Layer.merge(
  ExtractConfigService.Default,
  BunContext.layer,
);
