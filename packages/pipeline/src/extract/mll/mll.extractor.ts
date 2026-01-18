import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { MLLClient } from "../../mll/mll.client";
import type { MLLTeam } from "../../mll/mll.schema";
import { ExtractConfigService } from "../extract.config";

import { MLLManifestService } from "./mll.manifest";

// MLL operated from 2001-2020 (20 seasons)
const MLL_YEARS = [
  2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
  2014, 2015, 2016, 2017, 2018, 2019, 2020,
] as const;
type _MLLYear = (typeof MLL_YEARS)[number];

interface ExtractResult<T> {
  data: T;
  count: number;
  durationMs: number;
}

const withTiming = <T, E, R>(
  effect: Effect.Effect<T, E, R>,
): Effect.Effect<ExtractResult<T>, E, R> =>
  Effect.gen(function* () {
    const start = Date.now();
    const data = yield* effect;
    const durationMs = Date.now() - start;
    const count = Array.isArray(data) ? data.length : 1;
    return { data, count, durationMs };
  });

export class MLLExtractorService extends Effect.Service<MLLExtractorService>()(
  "MLLExtractorService",
  {
    effect: Effect.gen(function* () {
      const client = yield* MLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* MLLManifestService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (year: number, entity: string) =>
        path.join(config.outputDir, "mll", String(year), `${entity}.json`);

      const saveJson = <T>(filePath: string, data: T) =>
        Effect.gen(function* () {
          const dir = path.dirname(filePath);
          yield* fs.makeDirectory(dir, { recursive: true });
          yield* fs.writeFileString(filePath, JSON.stringify(data, null, 2));
        }).pipe(
          Effect.catchAll((e) =>
            Effect.fail(new Error(`Failed to write file: ${String(e)}`)),
          ),
        );

      const extractTeams = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for year ${year}...`);
          const result = yield* withTiming(client.getTeams({ year }));
          yield* saveJson(getOutputPath(year, "teams"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} teams (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MLLTeam[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      return {
        MLL_YEARS,
        getOutputPath,
        saveJson,
        withTiming,
        extractTeams,
        // Expose injected dependencies for use by extractor methods
        client,
        config,
        manifestService,
        fs,
        path,
      };
    }),
    dependencies: [
      Layer.mergeAll(
        MLLClient.Default,
        ExtractConfigService.Default,
        MLLManifestService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
