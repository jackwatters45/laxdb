import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { BunServices } from "@effect/platform-bun";
import { Duration, Effect, Result, Layer, Schema, ServiceMap } from "effect";

import { WLAClient } from "../../wla/wla.client";
import type {
  WLAGame,
  WLAGoalie,
  WLAPlayer,
  WLAStanding,
  WLATeam,
} from "../../wla/wla.schema";
import { WLASeasonId } from "../../wla/wla.schema";
import { ExtractConfigService } from "../extract.config";
import { emptyExtractResult, withTiming } from "../extract.schema";
import {
  IncrementalExtractionService,
  type IncrementalExtractOptions,
} from "../incremental.service";
import { isCriticalError, saveJson, withRateLimitRetry } from "../util";

import type {
  WLAExtractionManifest,
  WLASeasonManifest,
} from "./wla.manifest";
import { WLAManifestService } from "./wla.manifest";

// WLA seasons range from 2005 to 2025 (21 seasons)
// Note: Not all seasons may have data available on Pointstreak
const WLA_SEASONS = [
  2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
const decodeWLASeasonId = Schema.decodeUnknownSync(WLASeasonId);

export class WLAExtractorService extends ServiceMap.Service<WLAExtractorService>()(
  "WLAExtractorService",
  {
    make: Effect.gen(function* () {
      const client = yield* WLAClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* WLAManifestService;
      const incremental = yield* IncrementalExtractionService;
      const fs = yield* FileSystem;
      const path = yield* Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (seasonId: number, entity: string) =>
        path.join(config.outputDir, "wla", String(seasonId), `${entity}.json`);
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
            .getTeams({ seasonId: decodeWLASeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly WLATeam[]);
          }
          yield* saveOutputJson(getOutputPath(seasonId, "teams"), result.success.data);
          yield* Effect.log(
            `     ✓ ${result.success.count} teams (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts players for a season. @see isCriticalError for error handling. */
      const extractPlayers = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏃 Extracting players for season ${seasonId}...`,
          );
          const result = yield* client
            .getPlayers({ seasonId: decodeWLASeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly WLAPlayer[]);
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

      /** Extracts goalies for a season. @see isCriticalError for error handling. */
      const extractGoalies = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🥅 Extracting goalies for season ${seasonId}...`,
          );
          const result = yield* client
            .getGoalies({ seasonId: decodeWLASeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly WLAGoalie[]);
          }
          yield* saveOutputJson(
            getOutputPath(seasonId, "goalies"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} goalies (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts standings for a season. @see isCriticalError for error handling. */
      const extractStandings = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏆 Extracting standings for season ${seasonId}...`,
          );
          const result = yield* client
            .getStandings({ seasonId: decodeWLASeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly WLAStanding[]);
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
            `  📅 Extracting schedule for season ${seasonId}...`,
          );
          const result = yield* client
            .getSchedule({ seasonId: decodeWLASeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly WLAGame[]);
          }
          yield* saveOutputJson(
            getOutputPath(seasonId, "schedule"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} games (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      const extractSeason = (
        seasonId: number,
        options: IncrementalExtractOptions & { includeSchedule?: boolean } = {},
      ): Effect.Effect<WLAExtractionManifest, unknown> =>
        Effect.gen(function* () {
          const { includeSchedule = false } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting WLA ${seasonId}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof WLASeasonManifest): boolean => {
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
            yield* Effect.log("  🏃 Players: skipped (already extracted)");
          }

          // Extract goalies
          if (shouldExtract("goalies")) {
            const result = yield* extractGoalies(seasonId);
            manifest = manifestService.markComplete(
              manifest,
              seasonId,
              "goalies",
              result.count,
              result.durationMs,
            );
            yield* Effect.sleep(Duration.millis(config.delayBetweenRequestsMs));
          } else {
            yield* Effect.log("  🥅 Goalies: skipped (already extracted)");
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
            yield* Effect.log("  🏆 Standings: skipped (already extracted)");
          }

          // Optionally extract schedule
          if (includeSchedule && shouldExtract("schedule")) {
            const result = yield* extractSchedule(seasonId);
            manifest = manifestService.markComplete(
              manifest,
              seasonId,
              "schedule",
              result.count,
              result.durationMs,
            );
          } else if (includeSchedule) {
            yield* Effect.log("  📅 Schedule: skipped (already extracted)");
          } else {
            yield* Effect.log("  📅 Schedule: skipped (includeSchedule=false)");
          }

          // Save manifest once at end of season
          yield* manifestService.save(manifest);

          return manifest;
        });

      const extractAll = (
        options: IncrementalExtractOptions & {
          includeSchedule?: boolean;
          startYear?: number;
          endYear?: number;
        } = {},
      ): Effect.Effect<WLAExtractionManifest, unknown> =>
        Effect.gen(function* () {
          const includeSchedule = options.includeSchedule ?? false;
          const startYear = options.startYear ?? 2005;
          const endYear = options.endYear ?? 2025;

          const seasonsToExtract = WLA_SEASONS.filter(
            (year) => year >= startYear && year <= endYear,
          );
          const totalSeasons = seasonsToExtract.length;

          yield* Effect.log(`\n${"#".repeat(60)}`);
          yield* Effect.log(
            `WLA EXTRACTION: ${totalSeasons} seasons (${startYear}-${endYear})`,
          );
          yield* Effect.log(
            `Options: mode=${options.mode ?? "skip-existing"}, includeSchedule=${includeSchedule}`,
          );
          yield* Effect.log("#".repeat(60));

          const overallStart = Date.now();
          let lastManifest = yield* manifestService.load;

          for (const [i, year] of seasonsToExtract.entries()) {
            yield* Effect.log(
              `\n>>> Progress: ${i + 1}/${totalSeasons} seasons`,
            );
            lastManifest = yield* extractSeason(year, {
              ...options,
              includeSchedule,
            });
          }

          const totalDurationMs = Date.now() - overallStart;
          const minutes = Math.floor(totalDurationMs / 60000);
          const seconds = Math.floor((totalDurationMs % 60000) / 1000);

          yield* Effect.log(`\n${"#".repeat(60)}`);
          yield* Effect.log(`EXTRACTION COMPLETE`);
          yield* Effect.log(
            `Total: ${totalSeasons} seasons in ${minutes}m ${seconds}s`,
          );
          yield* Effect.log("#".repeat(60));

          return lastManifest;
        });

      return {
        // Constants
        WLA_SEASONS,

        // Helpers
        getOutputPath,

        // Extract methods
        extractTeams,
        extractPlayers,
        extractGoalies,
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
        WLAClient.Default,
        ExtractConfigService.Default,
        WLAManifestService.Default,
        IncrementalExtractionService.Default,
        BunServices.layer,
      ),
    ),
  );
  static readonly Default = this.layer;
}
