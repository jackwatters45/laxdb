import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Layer } from "effect";

import { MLLClient } from "../../mll/mll.client";
import type {
  MLLGame,
  MLLGoalie,
  MLLPlayer,
  MLLStanding,
  MLLStatLeader,
  MLLTeam,
} from "../../mll/mll.schema";
import { ExtractConfigService } from "../extract.config";

import type { MLLSeasonManifest } from "./mll.manifest";
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

      const extractPlayers = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏃 Extracting players for year ${year}...`);
          const result = yield* withTiming(client.getPlayers({ year }));
          yield* saveJson(getOutputPath(year, "players"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} players (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MLLPlayer[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractGoalies = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🥅 Extracting goalies for year ${year}...`);
          const result = yield* withTiming(client.getGoalies({ year }));
          yield* saveJson(getOutputPath(year, "goalies"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} goalies (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MLLGoalie[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractStandings = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏆 Extracting standings for year ${year}...`);
          const result = yield* withTiming(client.getStandings({ year }));
          yield* saveJson(getOutputPath(year, "standings"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} standings (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MLLStanding[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractStatLeaders = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  ⭐ Extracting stat leaders for year ${year}...`);
          const result = yield* withTiming(client.getStatLeaders({ year }));
          yield* saveJson(getOutputPath(year, "stat-leaders"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} stat leaders (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MLLStatLeader[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      // Estimate expected games based on MLL team counts
      // MLL had ~12-14 reg season games per team + playoffs
      const getExpectedGames = (teamCount: number): number => {
        // Regular season: each team plays ~12 games
        // Playoffs: 4 teams, 3 games (2 semi + 1 final)
        const regSeasonGames = Math.floor((teamCount * 12) / 2); // divide by 2 (each game has 2 teams)
        const playoffGames = 3;
        return regSeasonGames + playoffGames;
      };

      const extractSchedule = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📅 Extracting schedule for year ${year} (via Wayback)...`,
          );
          const result = yield* withTiming(client.getSchedule({ year }));
          yield* saveJson(getOutputPath(year, "schedule"), result.data);

          // Get team count for coverage calculation
          const teamsPath = getOutputPath(year, "teams");
          const teamsContent = yield* fs
            .readFileString(teamsPath)
            .pipe(Effect.catchAll(() => Effect.succeed("[]")));
          const teams = JSON.parse(teamsContent) as unknown[];
          const teamCount = teams.length || 6; // Default to 6 if no teams file
          const expectedGames = getExpectedGames(teamCount);
          const coverage =
            expectedGames > 0
              ? Math.round((result.count / expectedGames) * 100)
              : 0;

          if (result.count === 0) {
            yield* Effect.log(
              `     ⚠ No schedule data found (Wayback coverage may be incomplete)`,
            );
            yield* Effect.log(
              `     📊 Schedule coverage: 0% (0/${expectedGames} expected games)`,
            );
          } else {
            yield* Effect.log(
              `     ✓ ${result.count} games (${result.durationMs}ms)`,
            );
            yield* Effect.log(
              `     📊 Schedule coverage: ${coverage}% (${result.count}/${expectedGames} expected games)`,
            );
          }
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(
                `     ✗ Failed: ${e} (schedule may be incomplete for this year)`,
              );
              yield* Effect.log(`     📊 Schedule coverage: 0%`);
              return {
                data: [] as readonly MLLGame[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      // Delay constants for rate limiting
      const STATSCREW_DELAY_MS = 2000;
      const WAYBACK_DELAY_MS = 5000;

      const extractSeason = (
        year: number,
        options: {
          skipExisting?: boolean;
          includeSchedule?: boolean;
        } = {},
      ) =>
        Effect.gen(function* () {
          const { skipExisting = true, includeSchedule = false } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting MLL ${year}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof MLLSeasonManifest): boolean => {
            if (!skipExisting) return true;
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
            yield* Effect.sleep(Duration.millis(STATSCREW_DELAY_MS));
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
            yield* Effect.sleep(Duration.millis(STATSCREW_DELAY_MS));
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
            yield* Effect.sleep(Duration.millis(STATSCREW_DELAY_MS));
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
            yield* Effect.sleep(Duration.millis(STATSCREW_DELAY_MS));
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
            yield* Effect.sleep(Duration.millis(WAYBACK_DELAY_MS));
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

      const extractAllSeasons = (
        options: {
          skipExisting?: boolean;
          includeSchedule?: boolean;
          startYear?: number;
          endYear?: number;
        } = {},
      ) =>
        Effect.gen(function* () {
          const skipExisting = options.skipExisting ?? true;
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
        saveJson,
        withTiming,
        extractTeams,
        extractPlayers,
        extractGoalies,
        extractStandings,
        extractStatLeaders,
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
        MLLClient.Default,
        ExtractConfigService.Default,
        MLLManifestService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
