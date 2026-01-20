import { Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Either, Layer } from "effect";

import { NLLClient } from "../../nll/nll.client";
import type {
  NLLMatch,
  NLLPlayer,
  NLLPlayerStatsRow,
  NLLStanding,
  NLLTeam,
} from "../../nll/nll.schema";
import { ExtractConfigService } from "../extract.config";
import { emptyExtractResult, withTiming } from "../extract.schema";
import { saveJson } from "../util";

import { NLLManifestService, type NLLSeasonManifest } from "./nll.manifest";

const NLL_SEASONS = [225] as const;

export class NLLExtractorService extends Effect.Service<NLLExtractorService>()(
  "NLLExtractorService",
  {
    effect: Effect.gen(function* () {
      const client = yield* NLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* NLLManifestService;
      const path = yield* Path.Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (seasonId: number, entity: string) =>
        path.join(config.outputDir, "nll", String(seasonId), `${entity}.json`);

      const extractTeams = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for season ${seasonId}...`);
          const result = yield* withTiming(client.getTeams({ seasonId })).pipe(
            Effect.either,
          );
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            return emptyExtractResult([] as readonly NLLTeam[]);
          }
          yield* saveJson(getOutputPath(seasonId, "teams"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} teams (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      const extractPlayers = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  👥 Extracting players for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getPlayers({ seasonId }),
          ).pipe(Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            return emptyExtractResult([] as readonly NLLPlayer[]);
          }
          yield* saveJson(
            getOutputPath(seasonId, "players"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} players (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      const extractPlayerStats = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📊 Extracting player stats for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getPlayerStats({ seasonId, phase: "REG" }),
          ).pipe(Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            return emptyExtractResult([] as readonly NLLPlayerStatsRow[]);
          }
          yield* saveJson(
            getOutputPath(seasonId, "player-stats"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} player stats (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      const extractStandings = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📈 Extracting standings for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getStandings({ seasonId }),
          ).pipe(Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            return emptyExtractResult([] as readonly NLLStanding[]);
          }
          yield* saveJson(
            getOutputPath(seasonId, "standings"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} standings (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      const extractSchedule = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🎮 Extracting schedule for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getSchedule({ seasonId }),
          ).pipe(Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            return emptyExtractResult([] as readonly NLLMatch[]);
          }
          yield* saveJson(
            getOutputPath(seasonId, "schedule"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} matches (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

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
            yield* Effect.sleep(Duration.millis(config.delayBetweenRequestsMs));
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
            yield* Effect.sleep(Duration.millis(config.delayBetweenRequestsMs));
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
            yield* Effect.sleep(Duration.millis(config.delayBetweenRequestsMs));
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
            yield* Effect.sleep(Duration.millis(config.delayBetweenRequestsMs));
          } else {
            yield* Effect.log("  🎮 Schedule: skipped (already extracted)");
          }

          // Extract player stats (scraped from nll.com)
          if (shouldExtract("playerStats")) {
            const result = yield* extractPlayerStats(seasonId);
            manifest = manifestService.markComplete(
              manifest,
              seasonId,
              "playerStats",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
          } else {
            yield* Effect.log("  📊 Player Stats: skipped (already extracted)");
          }

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`NLL Season ${seasonId} extraction complete`);
          yield* Effect.log("=".repeat(50));

          return manifest;
        });

      const extractAll = (options: { skipExisting?: boolean } = {}) =>
        Effect.gen(function* () {
          yield* Effect.log("🏈 NLL Full Extraction");
          yield* Effect.log(`Output directory: ${config.outputDir}`);

          for (const seasonId of NLL_SEASONS) {
            yield* extractSeason(seasonId, options);
            yield* Effect.sleep(Duration.millis(config.delayBetweenBatchesMs));
          }

          const manifest = yield* manifestService.load;
          yield* Effect.log("\n" + "=".repeat(50));
          yield* Effect.log("EXTRACTION COMPLETE");
          yield* Effect.log("=".repeat(50));

          return manifest;
        });

      return {
        NLL_SEASONS,
        getOutputPath,
        extractTeams,
        extractPlayers,
        extractPlayerStats,
        extractStandings,
        extractSchedule,
        extractSeason,
        extractAll,
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
