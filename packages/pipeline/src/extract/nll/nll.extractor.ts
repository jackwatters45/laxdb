import { BunServices } from "@effect/platform-bun";
import { Duration, Effect, Result, Layer, ServiceMap } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";

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
import {
  IncrementalExtractionService,
  type IncrementalExtractOptions,
} from "../incremental.service";
import { isCriticalError, saveJson, withRateLimitRetry } from "../util";

import {
  NLLManifestService,
  type NLLExtractionManifest,
  type NLLSeasonManifest,
} from "./nll.manifest";

const NLL_SEASONS = [225] as const;

export class NLLExtractorService extends ServiceMap.Service<NLLExtractorService>()(
  "NLLExtractorService",
  {
    make: Effect.gen(function* () {
      const client = yield* NLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* NLLManifestService;
      const incremental = yield* IncrementalExtractionService;
      const fs = yield* FileSystem;
      const path = yield* Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (seasonId: number, entity: string) =>
        path.join(config.outputDir, "nll", String(seasonId), `${entity}.json`);
      const ioServices = ServiceMap.make(FileSystem, fs).pipe(
        ServiceMap.add(Path, path),
      );

      const saveOutputJson = <T>(filePath: string, data: T) =>
        saveJson(filePath, data).pipe(Effect.provide(ioServices));

      /** Extracts teams for a season. @see isCriticalError for error handling. */
      const extractTeams = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for season ${seasonId}...`);
          const result = yield* client
            .getTeams({ seasonId })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly NLLTeam[]);
          }
          yield* saveOutputJson(
            getOutputPath(seasonId, "teams"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} teams (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts players for a season. @see isCriticalError for error handling. */
      const extractPlayers = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  👥 Extracting players for season ${seasonId}...`,
          );
          const result = yield* client
            .getPlayers({ seasonId })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly NLLPlayer[]);
          }
          yield* saveOutputJson(
            getOutputPath(seasonId, "players"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} players (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts player stats for a season. @see isCriticalError for error handling. */
      const extractPlayerStats = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📊 Extracting player stats for season ${seasonId}...`,
          );
          const result = yield* client
            .getPlayerStats({ seasonId, phase: "REG" })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly NLLPlayerStatsRow[]);
          }
          yield* saveOutputJson(
            getOutputPath(seasonId, "player-stats"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} player stats (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts standings for a season. @see isCriticalError for error handling. */
      const extractStandings = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📈 Extracting standings for season ${seasonId}...`,
          );
          const result = yield* client
            .getStandings({ seasonId })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly NLLStanding[]);
          }
          yield* saveOutputJson(
            getOutputPath(seasonId, "standings"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} standings (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts schedule for a season. @see isCriticalError for error handling. */
      const extractSchedule = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🎮 Extracting schedule for season ${seasonId}...`,
          );
          const result = yield* client
            .getSchedule({ seasonId })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly NLLMatch[]);
          }
          yield* saveOutputJson(
            getOutputPath(seasonId, "schedule"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} matches (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      const extractSeason = (
        seasonId: number,
        options: IncrementalExtractOptions = {},
      ): Effect.Effect<NLLExtractionManifest, unknown> =>
        Effect.gen(function* () {
          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting NLL Season ${seasonId}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof NLLSeasonManifest): boolean => {
            const seasonManifest = manifestService.getSeasonManifest(
              manifest,
              seasonId,
            );
            const entityStatus = seasonManifest[entity];
            return incremental.shouldExtract(entityStatus, seasonId, options);
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
          } else {
            yield* Effect.log("  📊 Player Stats: skipped (already extracted)");
          }

          // Save manifest once at end of season
          yield* manifestService.save(manifest);

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`NLL Season ${seasonId} extraction complete`);
          yield* Effect.log("=".repeat(50));

          return manifest;
        });

      const extractAll = (
        options: IncrementalExtractOptions = {},
      ): Effect.Effect<NLLExtractionManifest, unknown> =>
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
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(
      Layer.mergeAll(
        NLLClient.layer,
        ExtractConfigService.layer,
        NLLManifestService.layer,
        IncrementalExtractionService.layer,
        BunServices.layer,
      ),
    ),
  );
}
