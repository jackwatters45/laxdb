import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Either, Layer } from "effect";

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
import {
  type ExtractOptions,
  emptyExtractResult,
  withTiming,
} from "../extract.schema";
import { isCriticalError, saveJson, withRateLimitRetry } from "../util";

import type { MLLSeasonManifest } from "./mll.manifest";
import { MLLManifestService } from "./mll.manifest";

// MLL operated from 2001-2020 (20 seasons)
const MLL_YEARS = [
  2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
  2014, 2015, 2016, 2017, 2018, 2019, 2020,
] as const;

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

      /** Extracts teams for a season. @see isCriticalError for error handling. */
      const extractTeams = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for year ${year}...`);
          const result = yield* client
            .getTeams({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly MLLTeam[]);
          }
          yield* saveJson(getOutputPath(year, "teams"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} teams (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts players for a season. @see isCriticalError for error handling. */
      const extractPlayers = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏃 Extracting players for year ${year}...`);
          const result = yield* client
            .getPlayers({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly MLLPlayer[]);
          }
          yield* saveJson(getOutputPath(year, "players"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} players (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts goalies for a season. @see isCriticalError for error handling. */
      const extractGoalies = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🥅 Extracting goalies for year ${year}...`);
          const result = yield* client
            .getGoalies({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly MLLGoalie[]);
          }
          yield* saveJson(getOutputPath(year, "goalies"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} goalies (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts standings for a season. @see isCriticalError for error handling. */
      const extractStandings = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏆 Extracting standings for year ${year}...`);
          const result = yield* client
            .getStandings({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly MLLStanding[]);
          }
          yield* saveJson(getOutputPath(year, "standings"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} standings (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts stat leaders for a season. @see isCriticalError for error handling. */
      const extractStatLeaders = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  ⭐ Extracting stat leaders for year ${year}...`);
          const result = yield* client
            .getStatLeaders({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly MLLStatLeader[]);
          }
          yield* saveJson(
            getOutputPath(year, "stat-leaders"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} stat leaders (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts schedule via Wayback Machine. May have gaps for 2007-2019. @see isCriticalError for error handling. */
      const extractSchedule = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📅 Extracting schedule for year ${year} (via Wayback)...`,
          );
          const result = yield* client
            .getSchedule({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);

          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message} (schedule may be incomplete for this year)`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            yield* Effect.log(`     📊 Schedule coverage: 0%`);
            return emptyExtractResult([] as readonly MLLGame[]);
          }

          yield* saveJson(getOutputPath(year, "schedule"), result.right.data);

          // Get team count for coverage calculation
          const teamsPath = getOutputPath(year, "teams");
          const teamsContent = yield* fs
            .readFileString(teamsPath)
            .pipe(Effect.catchAll(() => Effect.succeed("[]")));
          const parsed: unknown = JSON.parse(teamsContent);
          const teams: unknown[] = Array.isArray(parsed) ? parsed : [];
          const teamCount = teams.length || 6; // Default to 6 if no teams file
          const expectedGames = getExpectedGames(teamCount);
          const coverage =
            expectedGames > 0
              ? Math.round((result.right.count / expectedGames) * 100)
              : 0;

          if (result.right.count === 0) {
            yield* Effect.log(
              `     ⚠ No schedule data found (Wayback coverage may be incomplete)`,
            );
            yield* Effect.log(
              `     📊 Schedule coverage: 0% (0/${expectedGames} expected games)`,
            );
          } else {
            yield* Effect.log(
              `     ✓ ${result.right.count} games (${result.right.durationMs}ms)`,
            );
            yield* Effect.log(
              `     📊 Schedule coverage: ${coverage}% (${result.right.count}/${expectedGames} expected games)`,
            );
          }
          return result.right;
        });

      const extractSeason = (
        year: number,
        options: ExtractOptions & { includeSchedule?: boolean } = {},
      ) =>
        Effect.gen(function* () {
          const {
            skipExisting = true,
            includeSchedule = false,
            maxAgeHours = null,
          } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting MLL ${year}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof MLLSeasonManifest): boolean => {
            if (!skipExisting) return true;
            // Check staleness if maxAgeHours is specified
            if (maxAgeHours !== null) {
              return manifestService.isStale(
                manifest,
                year,
                entity,
                maxAgeHours,
              );
            }
            return !manifestService.isExtracted(manifest, year, entity);
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
            yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
          } else if (includeSchedule) {
            yield* Effect.log("  📅 Schedule: skipped (already extracted)");
          } else {
            yield* Effect.log("  📅 Schedule: skipped (includeSchedule=false)");
          }

          return manifest;
        });

      const extractAll = (
        options: ExtractOptions & {
          includeSchedule?: boolean;
          startYear?: number;
          endYear?: number;
        } = {},
      ) =>
        Effect.gen(function* () {
          const skipExisting = options.skipExisting ?? true;
          const includeSchedule = options.includeSchedule ?? false;
          const maxAgeHours = options.maxAgeHours ?? null;
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
            `Options: skipExisting=${skipExisting}, includeSchedule=${includeSchedule}`,
          );
          yield* Effect.log("#".repeat(60));

          const overallStart = Date.now();
          let lastManifest = yield* manifestService.load;

          for (const [i, year] of yearsToExtract.entries()) {
            yield* Effect.log(`\n>>> Progress: ${i + 1}/${totalYears} seasons`);
            lastManifest = yield* extractSeason(year, {
              skipExisting,
              includeSchedule,
              maxAgeHours,
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
