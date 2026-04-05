import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { BunServices } from "@effect/platform-bun";
import { Duration, Effect, Result, Layer, Schema, ServiceMap } from "effect";

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
import { emptyExtractResult, withTiming } from "../extract.schema";
import {
  IncrementalExtractionService,
  type IncrementalExtractOptions,
} from "../incremental.service";
import { isCriticalError, saveJson, withRateLimitRetry } from "../util";

import type {
  MSLExtractionManifest,
  MSLSeasonManifest,
} from "./msl.manifest";
import { MSLManifestService } from "./msl.manifest";

// MSL seasons available on Gamesheet (2023-2025)
// Maps year to Gamesheet season ID
const MSL_SEASONS = Object.entries(MSL_GAMESHEET_SEASONS).map(
  ([year, seasonId]) => ({
    year: Number(year),
    seasonId,
  }),
);
const decodeMSLSeasonId = Schema.decodeUnknownSync(MSLSeasonId);

export class MSLExtractorService extends ServiceMap.Service<MSLExtractorService>()(
  "MSLExtractorService",
  {
    make: Effect.gen(function* () {
      const client = yield* MSLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* MSLManifestService;
      const incremental = yield* IncrementalExtractionService;
      const fs = yield* FileSystem;
      const path = yield* Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (seasonId: number, entity: string) =>
        path.join(config.outputDir, "msl", String(seasonId), `${entity}.json`);
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
            .getTeams({ seasonId: decodeMSLSeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MSLTeam[]);
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
            .getPlayers({ seasonId: decodeMSLSeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MSLPlayer[]);
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
            `  🧤 Extracting goalies for season ${seasonId}...`,
          );
          const result = yield* client
            .getGoalies({ seasonId: decodeMSLSeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MSLGoalie[]);
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
            `  📋 Extracting standings for season ${seasonId}...`,
          );
          const result = yield* client
            .getStandings({ seasonId: decodeMSLSeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MSLStanding[]);
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
            .getSchedule({ seasonId: decodeMSLSeasonId(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly MSLGame[]);
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
        options: IncrementalExtractOptions = {},
      ): Effect.Effect<MSLExtractionManifest, unknown> =>
        Effect.gen(function* () {
          // Find year for this seasonId
          const season = MSL_SEASONS.find((s) => s.seasonId === seasonId);
          const year = season?.year ?? "unknown";

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting MSL ${year} (Season ID: ${seasonId})`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof MSLSeasonManifest): boolean => {
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
            yield* Effect.sleep(Duration.millis(config.delayBetweenRequestsMs));
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
          } else {
            yield* Effect.log("  📅 Schedule: skipped (already extracted)");
          }

          // Save manifest once at end of season
          yield* manifestService.save(manifest);

          return manifest;
        });

      const extractAll = (
        options: IncrementalExtractOptions & {
          startYear?: number;
          endYear?: number;
        } = {},
      ): Effect.Effect<MSLExtractionManifest, unknown> =>
        Effect.gen(function* () {
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
          yield* Effect.log(`Options: mode=${options.mode ?? "skip-existing"}`);
          yield* Effect.log("#".repeat(60));

          const overallStart = Date.now();
          let lastManifest = yield* manifestService.load;

          for (const [i, season] of seasonsToExtract.entries()) {
            yield* Effect.log(
              `\n>>> Progress: ${i + 1}/${totalSeasons} seasons`,
            );
            lastManifest = yield* extractSeason(season.seasonId, options);
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
        MSLClient.Default,
        ExtractConfigService.Default,
        MSLManifestService.Default,
        IncrementalExtractionService.Default,
        BunServices.layer,
      ),
    ),
  );
  static readonly Default = this.layer;
}
