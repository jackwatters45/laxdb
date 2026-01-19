import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Layer } from "effect";

import { MSLClient } from "../../msl/msl.client";
import type {
  MSLGame,
  MSLGoalie,
  MSLPlayer,
  MSLStanding,
  MSLTeam,
} from "../../msl/msl.schema";
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

      const extractPlayers = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏃 Extracting players for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getPlayers({ seasonId: MSLSeasonId.make(seasonId) }),
          );
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
                data: [] as readonly MSLPlayer[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractGoalies = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🧤 Extracting goalies for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getGoalies({ seasonId: MSLSeasonId.make(seasonId) }),
          );
          yield* saveJson(getOutputPath(seasonId, "goalies"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} goalies (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MSLGoalie[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractStandings = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📋 Extracting standings for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getStandings({ seasonId: MSLSeasonId.make(seasonId) }),
          );
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
                data: [] as readonly MSLStanding[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractSchedule = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📅 Extracting schedule for season ${seasonId}...`,
          );
          const result = yield* withTiming(
            client.getSchedule({ seasonId: MSLSeasonId.make(seasonId) }),
          );
          yield* saveJson(getOutputPath(seasonId, "schedule"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} games (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly MSLGame[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      // Rate limiting delay between requests
      const REQUEST_DELAY_MS = 1000;

      const extractSeason = (
        seasonId: number,
        options: {
          skipExisting?: boolean;
        } = {},
      ) =>
        Effect.gen(function* () {
          const { skipExisting = true } = options;

          // Find year for this seasonId
          const season = MSL_SEASONS.find((s) => s.seasonId === seasonId);
          const year = season?.year ?? "unknown";

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting MSL ${year} (Season ID: ${seasonId})`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof MSLSeasonManifest): boolean => {
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
            yield* Effect.sleep(Duration.millis(REQUEST_DELAY_MS));
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
            yield* Effect.sleep(Duration.millis(REQUEST_DELAY_MS));
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
            yield* manifestService.save(manifest);
            yield* Effect.sleep(Duration.millis(REQUEST_DELAY_MS));
          } else {
            yield* Effect.log("  🧤 Goalies: skipped (already extracted)");
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
            yield* Effect.sleep(Duration.millis(REQUEST_DELAY_MS));
          } else {
            yield* Effect.log("  📋 Standings: skipped (already extracted)");
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
            yield* Effect.log("  📅 Schedule: skipped (already extracted)");
          }

          return manifest;
        });

      const extractAllSeasons = (
        options: {
          skipExisting?: boolean;
          startYear?: number;
          endYear?: number;
        } = {},
      ) =>
        Effect.gen(function* () {
          const skipExisting = options.skipExisting ?? true;
          const startYear = options.startYear ?? 2023;
          const endYear = options.endYear ?? 2025;

          const seasonsToExtract = MSL_SEASONS.filter(
            (s) => s.year >= startYear && s.year <= endYear,
          );
          const totalSeasons = seasonsToExtract.length;

          yield* Effect.log(`\n${"#".repeat(60)}`);
          yield* Effect.log(
            `MSL EXTRACTION: ${totalSeasons} seasons (${startYear}-${endYear})`,
          );
          yield* Effect.log(`Options: skipExisting=${skipExisting}`);
          yield* Effect.log("#".repeat(60));

          const overallStart = Date.now();
          let lastManifest = yield* manifestService.load;

          for (const [i, season] of seasonsToExtract.entries()) {
            yield* Effect.log(
              `\n>>> Progress: ${i + 1}/${totalSeasons} seasons`,
            );
            lastManifest = yield* extractSeason(season.seasonId, {
              skipExisting,
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
