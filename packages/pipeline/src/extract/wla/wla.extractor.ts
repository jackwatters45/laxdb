import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Layer } from "effect";

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

import type { WLASeasonManifest } from "./wla.manifest";
import { WLAManifestService } from "./wla.manifest";

// WLA seasons range from 2005 to 2025 (21 seasons)
// Note: Not all seasons may have data available on Pointstreak
const WLA_SEASONS = [
  2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
type _WLASeason = (typeof WLA_SEASONS)[number];

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

export class WLAExtractorService extends Effect.Service<WLAExtractorService>()(
  "WLAExtractorService",
  {
    effect: Effect.gen(function* () {
      const client = yield* WLAClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* WLAManifestService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (season: number, entity: string) =>
        path.join(config.outputDir, "wla", String(season), `${entity}.json`);

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

      const extractTeams = (season: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for season ${season}...`);
          const result = yield* withTiming(
            client.getTeams({ seasonId: WLASeasonId.make(season) }),
          );
          yield* saveJson(getOutputPath(season, "teams"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} teams (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly WLATeam[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractPlayers = (season: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏃 Extracting players for season ${season}...`);
          const result = yield* withTiming(
            client.getPlayers({ seasonId: WLASeasonId.make(season) }),
          );
          yield* saveJson(getOutputPath(season, "players"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} players (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly WLAPlayer[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractGoalies = (season: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🥅 Extracting goalies for season ${season}...`);
          const result = yield* withTiming(
            client.getGoalies({ seasonId: WLASeasonId.make(season) }),
          );
          yield* saveJson(getOutputPath(season, "goalies"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} goalies (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly WLAGoalie[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractStandings = (season: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏆 Extracting standings for season ${season}...`,
          );
          const result = yield* withTiming(
            client.getStandings({ seasonId: WLASeasonId.make(season) }),
          );
          yield* saveJson(getOutputPath(season, "standings"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} standings (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly WLAStanding[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractSchedule = (season: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📅 Extracting schedule for season ${season}...`);
          const result = yield* withTiming(
            client.getSchedule({ seasonId: WLASeasonId.make(season) }),
          );
          yield* saveJson(getOutputPath(season, "schedule"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} games (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly WLAGame[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      // Delay constant for rate limiting (WLA SPA scraping)
      const WLA_DELAY_MS = 1000;

      const extractSeason = (
        season: number,
        options: {
          skipExisting?: boolean;
          includeSchedule?: boolean;
        } = {},
      ) =>
        Effect.gen(function* () {
          const { skipExisting = true, includeSchedule = false } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting WLA ${season}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof WLASeasonManifest): boolean => {
            if (!skipExisting) return true;
            return !manifestService.isExtracted(manifest, season, entity);
          };

          // Extract teams
          if (shouldExtract("teams")) {
            const result = yield* extractTeams(season);
            manifest = manifestService.markComplete(
              manifest,
              season,
              "teams",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(WLA_DELAY_MS));
          } else {
            yield* Effect.log("  📊 Teams: skipped (already extracted)");
          }

          // Extract players
          if (shouldExtract("players")) {
            const result = yield* extractPlayers(season);
            manifest = manifestService.markComplete(
              manifest,
              season,
              "players",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(WLA_DELAY_MS));
          } else {
            yield* Effect.log("  🏃 Players: skipped (already extracted)");
          }

          // Extract goalies
          if (shouldExtract("goalies")) {
            const result = yield* extractGoalies(season);
            manifest = manifestService.markComplete(
              manifest,
              season,
              "goalies",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(WLA_DELAY_MS));
          } else {
            yield* Effect.log("  🥅 Goalies: skipped (already extracted)");
          }

          // Extract standings
          if (shouldExtract("standings")) {
            const result = yield* extractStandings(season);
            manifest = manifestService.markComplete(
              manifest,
              season,
              "standings",
              result.count,
              result.durationMs,
            );
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(WLA_DELAY_MS));
          } else {
            yield* Effect.log("  🏆 Standings: skipped (already extracted)");
          }

          // Optionally extract schedule
          if (includeSchedule && shouldExtract("schedule")) {
            const result = yield* extractSchedule(season);
            manifest = manifestService.markComplete(
              manifest,
              season,
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
            `Options: skipExisting=${skipExisting}, includeSchedule=${includeSchedule}`,
          );
          yield* Effect.log("#".repeat(60));

          const overallStart = Date.now();
          let lastManifest = yield* manifestService.load;

          for (const [i, year] of seasonsToExtract.entries()) {
            yield* Effect.log(
              `\n>>> Progress: ${i + 1}/${totalSeasons} seasons`,
            );
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
        saveJson,

        // Extract methods
        extractTeams,
        extractPlayers,
        extractGoalies,
        extractStandings,
        extractSchedule,
        extractSeason,
        extractAllSeasons,

        // Dependencies exposed for testing
        client,
        config,
        manifestService,
        fs,
        path,
      };
    }),
    dependencies: [
      Layer.merge(
        Layer.merge(WLAClient.Default, ExtractConfigService.Default),
        Layer.merge(WLAManifestService.Default, BunContext.layer),
      ),
    ],
  },
) {}
