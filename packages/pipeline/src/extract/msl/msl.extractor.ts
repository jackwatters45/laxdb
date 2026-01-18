import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { MSLClient } from "../../msl/msl.client";
import type { MSLTeam } from "../../msl/msl.schema";
import { MSL_GAMESHEET_SEASONS, MSLSeasonId } from "../../msl/msl.schema";
import { ExtractConfigService } from "../extract.config";

import type { MSLSeasonManifest } from "./msl.manifest";
import { MSLManifestService } from "./msl.manifest";

// MSL seasons available on Gamesheet (2023-2025)
// Maps year to Gamesheet season ID
const MSL_SEASONS = Object.entries(MSL_GAMESHEET_SEASONS).map(
  ([year, seasonId]) => ({
    year: Number(year),
    seasonId,
  }),
);
type _MSLSeason = (typeof MSL_SEASONS)[number];

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

export class MSLExtractorService extends Effect.Service<MSLExtractorService>()(
  "MSLExtractorService",
  {
    effect: Effect.gen(function* () {
      const client = yield* MSLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* MSLManifestService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (seasonId: number, entity: string) =>
        path.join(config.outputDir, "msl", String(seasonId), `${entity}.json`);

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

      const extractTeams = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for season ${seasonId}...`);
          const result = yield* withTiming(
            client.getTeams({ seasonId: MSLSeasonId.make(seasonId) }),
          );
          yield* saveJson(getOutputPath(seasonId, "teams"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} teams (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MSLTeam[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractPlayers = (_seasonId: number) =>
        Effect.succeed({
          data: [] as readonly unknown[],
          count: 0,
          durationMs: 0,
        });

      const extractGoalies = (_seasonId: number) =>
        Effect.succeed({
          data: [] as readonly unknown[],
          count: 0,
          durationMs: 0,
        });

      const extractStandings = (_seasonId: number) =>
        Effect.succeed({
          data: [] as readonly unknown[],
          count: 0,
          durationMs: 0,
        });

      const extractSchedule = (_seasonId: number) =>
        Effect.succeed({
          data: [] as readonly unknown[],
          count: 0,
          durationMs: 0,
        });

      // Placeholder for orchestration methods (implemented in subsequent stories)
      const extractSeason = (
        _seasonId: number,
        _options: {
          skipExisting?: boolean;
        } = {},
      ) => Effect.succeed({} as MSLSeasonManifest);

      const extractAllSeasons = (
        _options: {
          skipExisting?: boolean;
          startYear?: number;
          endYear?: number;
        } = {},
      ) => Effect.succeed({} as MSLSeasonManifest);

      return {
        MSL_SEASONS,
        getOutputPath,
        saveJson,
        withTiming,
        extractTeams,
        extractPlayers,
        extractGoalies,
        extractStandings,
        extractSchedule,
        extractSeason,
        extractAllSeasons,
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
        MSLClient.Default,
        ExtractConfigService.Default,
        MSLManifestService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
