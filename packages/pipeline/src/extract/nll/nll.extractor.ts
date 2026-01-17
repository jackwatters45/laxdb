import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Layer } from "effect";

import { NLLClient } from "../../nll/nll.client";
import type {
  NLLMatch,
  NLLPlayer,
  NLLStanding,
  NLLTeam,
} from "../../nll/nll.schema";
import { ExtractConfigService } from "../extract.config";

import { NLLManifestService, type NLLSeasonManifest } from "./nll.manifest";

const NLL_SEASONS = [225] as const;
type _NLLSeason = (typeof NLL_SEASONS)[number];

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

export class NLLExtractorService extends Effect.Service<NLLExtractorService>()(
  "NLLExtractorService",
  {
    effect: Effect.gen(function* () {
      const client = yield* NLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* NLLManifestService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (seasonId: number, entity: string) =>
        path.join(config.outputDir, "nll", String(seasonId), `${entity}.json`);

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
          const result = yield* withTiming(client.getTeams({ seasonId }));
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
                data: [] as readonly NLLTeam[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractPlayers = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  👥 Extracting players for season ${seasonId}...`,
          );
          const result = yield* withTiming(client.getPlayers({ seasonId }));
          yield* saveJson(getOutputPath(seasonId, "players"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} players (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly NLLPlayer[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractStandings = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📈 Extracting standings for season ${seasonId}...`,
          );
          const result = yield* withTiming(client.getStandings({ seasonId }));
          yield* saveJson(getOutputPath(seasonId, "standings"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} standings (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly NLLStanding[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractSchedule = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🎮 Extracting schedule for season ${seasonId}...`,
          );
          const result = yield* withTiming(client.getSchedule({ seasonId }));
          yield* saveJson(getOutputPath(seasonId, "schedule"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} matches (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly NLLMatch[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractSeason = (
        seasonId: number,
        options: { skipExisting?: boolean } = {},
      ) =>
        Effect.gen(function* () {
          const { skipExisting = true } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting NLL Season ${seasonId}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof NLLSeasonManifest): boolean => {
            if (!skipExisting) return true;
            return !manifestService.isExtracted(manifest, seasonId, entity);
          };

          // Extract teams
          if (shouldExtract("teams")) {
            const result = yield* extractTeams(seasonId);
            manifest = manifestService.markComplete(
              manifest,
              seasonId,
              "teams",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(500));
          } else {
            yield* Effect.log("  📊 Teams: skipped (already extracted)");
          }

          // Extract players
          if (shouldExtract("players")) {
            const result = yield* extractPlayers(seasonId);
            manifest = manifestService.markComplete(
              manifest,
              seasonId,
              "players",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(500));
          } else {
            yield* Effect.log("  👥 Players: skipped (already extracted)");
          }

          // Extract standings
          if (shouldExtract("standings")) {
            const result = yield* extractStandings(seasonId);
            manifest = manifestService.markComplete(
              manifest,
              seasonId,
              "standings",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(500));
          } else {
            yield* Effect.log("  📈 Standings: skipped (already extracted)");
          }

          // Extract schedule
          if (shouldExtract("schedule")) {
            const result = yield* extractSchedule(seasonId);
            manifest = manifestService.markComplete(
              manifest,
              seasonId,
              "schedule",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
          } else {
            yield* Effect.log("  🎮 Schedule: skipped (already extracted)");
          }

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`NLL Season ${seasonId} extraction complete`);
          yield* Effect.log("=".repeat(50));

          return manifest;
        });

      return {
        client,
        config,
        manifestService,
        fs,
        path,
        NLL_SEASONS,
        getOutputPath,
        saveJson,
        withTiming,
        extractTeams,
        extractPlayers,
        extractStandings,
        extractSchedule,
        extractSeason,
      };
    }),
    dependencies: [
      Layer.mergeAll(
        NLLClient.Default,
        ExtractConfigService.Default,
        NLLManifestService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
