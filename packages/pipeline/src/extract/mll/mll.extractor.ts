import { BunServices } from "@effect/platform-bun";
import { Duration, Effect, Result, Layer, ServiceMap } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";

import { MLLClient } from "../../mll/mll.client";
import {
  getExpectedGames,
  type MLLGame,
  type MLLGoalie,
  type MLLPlayer,
  type MLLStanding,
  type MLLStatLeader,
  type MLLTeam,
} from "../../mll/mll.schema";
import { ExtractConfigService } from "../extract.config";
import { emptyExtractResult, withTiming } from "../extract.schema";
import {
  IncrementalExtractionService,
  type IncrementalExtractOptions,
} from "../incremental.service";
import { isCriticalError, saveJson, withRateLimitRetry } from "../util";

import type { MLLExtractionManifest, MLLSeasonManifest } from "./mll.manifest";
import { MLLManifestService } from "./mll.manifest";

// MLL operated from 2001-2020 (20 seasons)
const MLL_YEARS = [
  2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
  2014, 2015, 2016, 2017, 2018, 2019, 2020,
] as const;

export class MLLExtractorService extends ServiceMap.Service<MLLExtractorService>()(
  "MLLExtractorService",
  {
    make: Effect.gen(function* () {
      const client = yield* MLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* MLLManifestService;
      const incremental = yield* IncrementalExtractionService;
      const fs = yield* FileSystem;
      const path = yield* Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (year: number, entity: string) =>
        path.join(config.outputDir, "mll", String(year), `${entity}.json`);
      const ioServices = ServiceMap.make(FileSystem, fs).pipe(
        ServiceMap.add(Path, path),
      );

      const saveOutputJson = <T>(filePath: string, data: T) =>
        saveJson(filePath, data).pipe(Effect.provide(ioServices));

      /** Extracts teams for a season. @see isCriticalError for error handling. */
      const extractTeams = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for year ${year}...`);
          const result = yield* client
            .getTeams({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MLLTeam[]);
          }
          yield* saveOutputJson(
            getOutputPath(year, "teams"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} teams (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts players for a season. @see isCriticalError for error handling. */
      const extractPlayers = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏃 Extracting players for year ${year}...`);
          const result = yield* client
            .getPlayers({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MLLPlayer[]);
          }
          yield* saveOutputJson(
            getOutputPath(year, "players"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} players (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts goalies for a season. @see isCriticalError for error handling. */
      const extractGoalies = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🥅 Extracting goalies for year ${year}...`);
          const result = yield* client
            .getGoalies({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MLLGoalie[]);
          }
          yield* saveOutputJson(
            getOutputPath(year, "goalies"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} goalies (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts standings for a season. @see isCriticalError for error handling. */
      const extractStandings = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏆 Extracting standings for year ${year}...`);
          const result = yield* client
            .getStandings({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MLLStanding[]);
          }
          yield* saveOutputJson(
            getOutputPath(year, "standings"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} standings (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts stat leaders for a season. @see isCriticalError for error handling. */
      const extractStatLeaders = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  ⭐ Extracting stat leaders for year ${year}...`);
          const result = yield* client
            .getStatLeaders({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MLLStatLeader[]);
          }
          yield* saveOutputJson(
            getOutputPath(year, "stat-leaders"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} stat leaders (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts schedule via Wayback Machine. May have gaps for 2007-2019. @see isCriticalError for error handling. */
      const extractSchedule = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📅 Extracting schedule for year ${year} (via Wayback)...`,
          );
          const result = yield* client
            .getSchedule({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);

          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message} (schedule may be incomplete for this year)`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            yield* Effect.log(`     📊 Schedule coverage: 0%`);
            return emptyExtractResult([] as readonly MLLGame[]);
          }

          yield* saveOutputJson(
            getOutputPath(year, "schedule"),
            result.success.data,
          );

          // Get team count for coverage calculation
          const teamsPath = getOutputPath(year, "teams");
          const teamsContent = yield* fs
            .readFileString(teamsPath)
            .pipe(Effect.catchTag("PlatformError", () => Effect.succeed("[]")));
          const parsed: unknown = JSON.parse(teamsContent);
          const teams: unknown[] = Array.isArray(parsed) ? parsed : [];
          const teamCount = teams.length || 6; // Default to 6 if no teams file
          const expectedGames = getExpectedGames(teamCount);
          const coverage =
            expectedGames > 0
              ? Math.round((result.success.count / expectedGames) * 100)
              : 0;

          if (result.success.count === 0) {
            yield* Effect.log(
              `     ⚠ No schedule data found (Wayback coverage may be incomplete)`,
            );
            yield* Effect.log(
              `     📊 Schedule coverage: 0% (0/${expectedGames} expected games)`,
            );
          } else {
            yield* Effect.log(
              `     ✓ ${result.success.count} games (${result.success.durationMs}ms)`,
            );
            yield* Effect.log(
              `     📊 Schedule coverage: ${coverage}% (${result.success.count}/${expectedGames} expected games)`,
            );
          }
          return result.success;
        });

      const extractSeason = (
        year: number,
        options: IncrementalExtractOptions & { includeSchedule?: boolean } = {},
      ): Effect.Effect<MLLExtractionManifest, unknown> =>
        Effect.gen(function* () {
          const { includeSchedule = false } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting MLL ${year}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof MLLSeasonManifest): boolean => {
            const seasonManifest = manifestService.getSeasonManifest(
              manifest,
              year,
            );
            const entityStatus = seasonManifest[entity];
            return incremental.shouldExtract(entityStatus, year, options);
          };

          // Extract teams
          if (shouldExtract("teams")) {
            const result = yield* extractTeams(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
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
            const result = yield* extractPlayers(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
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
            const result = yield* extractGoalies(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
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
            const result = yield* extractStandings(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "standings",
              result.count,
              result.durationMs,
            );
            yield* Effect.sleep(Duration.millis(config.delayBetweenRequestsMs));
          } else {
            yield* Effect.log("  🏆 Standings: skipped (already extracted)");
          }

          // Extract stat leaders
          if (shouldExtract("statLeaders")) {
            const result = yield* extractStatLeaders(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "statLeaders",
              result.count,
              result.durationMs,
            );
          } else {
            yield* Effect.log("  ⭐ Stat leaders: skipped (already extracted)");
          }

          // Optionally extract schedule (slower due to Wayback)
          if (includeSchedule && shouldExtract("schedule")) {
            yield* Effect.log("  ⏳ Waiting before Wayback request...");
            yield* Effect.sleep(Duration.millis(config.delayBetweenBatchesMs));
            const result = yield* extractSchedule(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
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
      ): Effect.Effect<MLLExtractionManifest, unknown> =>
        Effect.gen(function* () {
          const includeSchedule = options.includeSchedule ?? false;
          const startYear = options.startYear ?? 2001;
          const endYear = options.endYear ?? 2020;

          const yearsToExtract = MLL_YEARS.filter(
            (y) => y >= startYear && y <= endYear,
          );
          const totalYears = yearsToExtract.length;

          yield* Effect.log(`\n${"#".repeat(60)}`);
          yield* Effect.log(
            `MLL EXTRACTION: ${totalYears} seasons (${startYear}-${endYear})`,
          );
          yield* Effect.log(
            `Options: mode=${options.mode ?? "skip-existing"}, includeSchedule=${includeSchedule}`,
          );
          yield* Effect.log("#".repeat(60));

          const overallStart = Date.now();
          let lastManifest = yield* manifestService.load;

          for (const [i, year] of yearsToExtract.entries()) {
            yield* Effect.log(`\n>>> Progress: ${i + 1}/${totalYears} seasons`);
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
            `Total: ${totalYears} seasons in ${minutes}m ${seconds}s`,
          );
          yield* Effect.log("#".repeat(60));

          return lastManifest;
        });

      return {
        MLL_YEARS,
        getOutputPath,
        extractTeams,
        extractPlayers,
        extractGoalies,
        extractStandings,
        extractStatLeaders,
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
        MLLClient.layer,
        ExtractConfigService.layer,
        MLLManifestService.layer,
        IncrementalExtractionService.layer,
        BunServices.layer,
      ),
    ),
  );
}
