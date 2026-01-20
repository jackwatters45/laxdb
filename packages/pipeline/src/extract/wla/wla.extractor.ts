import { Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Either, Layer } from "effect";

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
import {
  type ExtractOptions,
  emptyExtractResult,
  withTiming,
} from "../extract.schema";
import { isCriticalError, saveJson, withRateLimitRetry } from "../util";

import type { WLASeasonManifest } from "./wla.manifest";
import { WLAManifestService } from "./wla.manifest";

// WLA seasons range from 2005 to 2025 (21 seasons)
// Note: Not all seasons may have data available on Pointstreak
const WLA_SEASONS = [
  2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;

export class WLAExtractorService extends Effect.Service<WLAExtractorService>()(
  "WLAExtractorService",
  {
    effect: Effect.gen(function* () {
      const client = yield* WLAClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* WLAManifestService;
      const path = yield* Path.Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (seasonId: number, entity: string) =>
        path.join(config.outputDir, "wla", String(seasonId), `${entity}.json`);

      /** Extracts teams for a season. @see isCriticalError for error handling. */
      const extractTeams = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for season ${seasonId}...`);
          const result = yield* client
            .getTeams({ seasonId: WLASeasonId.make(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly WLATeam[]);
          }
          yield* saveJson(getOutputPath(seasonId, "teams"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} teams (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts players for a season. @see isCriticalError for error handling. */
      const extractPlayers = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏃 Extracting players for season ${seasonId}...`,
          );
          const result = yield* client
            .getPlayers({ seasonId: WLASeasonId.make(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly WLAPlayer[]);
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

      /** Extracts goalies for a season. @see isCriticalError for error handling. */
      const extractGoalies = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🥅 Extracting goalies for season ${seasonId}...`,
          );
          const result = yield* client
            .getGoalies({ seasonId: WLASeasonId.make(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly WLAGoalie[]);
          }
          yield* saveJson(
            getOutputPath(seasonId, "goalies"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} goalies (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts standings for a season. @see isCriticalError for error handling. */
      const extractStandings = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏆 Extracting standings for season ${seasonId}...`,
          );
          const result = yield* client
            .getStandings({ seasonId: WLASeasonId.make(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly WLAStanding[]);
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

      /** Extracts schedule for a season. @see isCriticalError for error handling. */
      const extractSchedule = (seasonId: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  📅 Extracting schedule for season ${seasonId}...`,
          );
          const result = yield* client
            .getSchedule({ seasonId: WLASeasonId.make(seasonId) })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly WLAGame[]);
          }
          yield* saveJson(
            getOutputPath(seasonId, "schedule"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} games (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      const extractSeason = (
        seasonId: number,
        options: ExtractOptions & { includeSchedule?: boolean } = {},
      ) =>
        Effect.gen(function* () {
          const {
            skipExisting = true,
            includeSchedule = false,
            maxAgeHours = null,
          } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting WLA ${seasonId}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof WLASeasonManifest): boolean => {
            if (!skipExisting) return true;
            // Check staleness if maxAgeHours is specified
            if (maxAgeHours !== null) {
              return manifestService.isStale(
                manifest,
                seasonId,
                entity,
                maxAgeHours,
              );
            }
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
            yield* manifestService.save(manifest);
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
              maxAgeHours,
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
    dependencies: [
      Layer.mergeAll(
        WLAClient.Default,
        ExtractConfigService.Default,
        WLAManifestService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
