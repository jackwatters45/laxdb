import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import type { PlatformError } from "effect/PlatformError";
import { BunServices } from "@effect/platform-bun";
import { Duration, Effect, Result, Layer, Schema, ServiceMap } from "effect";

import { PLLClient } from "../../pll/pll.client";
import {
  PLLEvent,
  PLLPlayer,
  PLLTeam,
  type PLLAdvancedPlayer,
  type PLLEventDetail,
  type PLLGraphQLStanding,
  type PLLPlayerDetail,
  type PLLTeamStanding,
} from "../../pll/pll.schema";
import { ExtractConfigService } from "../extract.config";
import {
  type SeasonManifest,
  emptyExtractResult,
  withTiming,
} from "../extract.schema";
import {
  IncrementalExtractionService,
  type IncrementalExtractOptions,
} from "../incremental.service";
import { isCriticalError, saveJson, withRateLimitRetry } from "../util";

import {
  type PLLExtractionManifest,
  PLLManifestService,
} from "./pll.manifest";

const PLL_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

export class PLLExtractorService extends ServiceMap.Service<PLLExtractorService>()(
  "PLLExtractorService",
  {
    make: Effect.gen(function* () {
      const pll = yield* PLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* PLLManifestService;
      const incremental = yield* IncrementalExtractionService;
      const fs = yield* FileSystem;
      const path = yield* Path;
      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (year: number, entity: string) =>
        path.join(config.outputDir, "pll", String(year), `${entity}.json`);
      const ioServices = ServiceMap.make(FileSystem, fs).pipe(
        ServiceMap.add(Path, path),
      );

      const saveOutputJson = <T>(filePath: string, data: T) =>
        saveJson(filePath, data).pipe(Effect.provide(ioServices));

      const readJsonFile = (filePath: string) =>
        fs
          .readFileString(filePath, "utf-8")
          .pipe(
            Effect.catchTag("PlatformError", (error: PlatformError) =>
              Effect.logWarning(
                `Could not read file at ${filePath}, using empty array: ${error.message}`,
              ).pipe(Effect.andThen(Effect.succeed("[]"))),
            ),
          );

      /** Extracts teams for a season. @see isCriticalError for error handling. */
      const extractTeams = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for ${year}...`);
          const result = yield* pll
            .getTeams({ year, includeChampSeries: true })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly PLLTeam[]);
          }
          yield* saveOutputJson(getOutputPath(year, "teams"), result.success.data);
          yield* Effect.log(
            `     ✓ ${result.success.count} teams (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      const extractTeamDetails = (year: number, teams: readonly PLLTeam[]) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏟️ Extracting team details for ${year}...`);
          const start = Date.now();

          const results = yield* Effect.forEach(
            teams,
            (team) =>
              pll
                .getTeamDetail({
                  id: team.officialId,
                  year,
                  statsYear: year,
                  eventsYear: year,
                  includeChampSeries: true,
                })
                .pipe(
                  Effect.result,
                  Effect.tap(() =>
                    Effect.sleep(
                      Duration.millis(config.delayBetweenRequestsMs),
                    ),
                  ),
                ),
            { concurrency: config.concurrency },
          );

          const details = results
            .filter((r) => Result.isSuccess(r))
            .map((r) => r.success);

          const durationMs = Date.now() - start;
          yield* saveOutputJson(getOutputPath(year, "team-details"), details);
          yield* Effect.log(
            `     ✓ ${details.length} team details (${durationMs}ms)`,
          );

          return { data: details, count: details.length, durationMs };
        });

      /** Extracts players for a season. @see isCriticalError for error handling. */
      const extractPlayers = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  👥 Extracting players for ${year}...`);
          const result = yield* pll
            .getPlayers({
              season: year,
              includeReg: true,
              includePost: true,
              includeZPP: true,
              limit: 1000,
            })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly PLLPlayer[]);
          }
          yield* saveOutputJson(getOutputPath(year, "players"), result.success.data);
          yield* Effect.log(
            `     ✓ ${result.success.count} players (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts advanced players for a season. @see isCriticalError for error handling. */
      const extractAdvancedPlayers = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🔬 Extracting advanced players for ${year}...`);
          const result = yield* pll
            .getAdvancedPlayers({
              year,
              limit: 500,
              league: "PLL",
            })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly PLLAdvancedPlayer[]);
          }
          yield* saveOutputJson(
            getOutputPath(year, "advanced-players"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} advanced players (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      const extractPlayerDetails = (
        year: number,
        players: readonly PLLPlayer[],
      ) =>
        Effect.gen(function* () {
          yield* Effect.log(`  👤 Extracting player details for ${year}...`);
          const start = Date.now();

          const playersWithSlug = players.filter(
            (p): p is PLLPlayer & { slug: string } => p.slug !== null,
          );
          yield* Effect.log(
            `     Processing ${playersWithSlug.length} players with slugs...`,
          );

          const results = yield* Effect.forEach(
            playersWithSlug,
            (player) =>
              pll
                .getPlayerDetail({
                  slug: player.slug,
                  year,
                  statsYear: year,
                })
                .pipe(
                  Effect.result,
                  Effect.tap(() =>
                    Effect.sleep(
                      Duration.millis(config.delayBetweenRequestsMs),
                    ),
                  ),
                ),
            { concurrency: config.concurrency },
          );

          const details = results
            .filter(Result.isSuccess)
            .map((r) => r.success)
            .filter((d): d is PLLPlayerDetail => d !== null);

          const durationMs = Date.now() - start;
          yield* saveOutputJson(getOutputPath(year, "player-details"), details);
          yield* Effect.log(
            `     ✓ ${details.length} player details (${durationMs}ms)`,
          );

          return { data: details, count: details.length, durationMs };
        });

      /** Extracts events for a season. @see isCriticalError for error handling. */
      const extractEvents = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🎮 Extracting events for ${year}...`);
          const result = yield* pll
            .getEvents({ year })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly PLLEvent[]);
          }
          yield* saveOutputJson(getOutputPath(year, "events"), result.success.data);
          yield* Effect.log(
            `     ✓ ${result.success.count} events (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      const extractEventDetails = (year: number, events: readonly PLLEvent[]) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📋 Extracting event details for ${year}...`);
          const start = Date.now();

          const completedEvents = events.filter(
            (e): e is PLLEvent & { slugname: string } =>
              e.eventStatus === 3 && e.slugname !== null,
          );
          yield* Effect.log(
            `     Processing ${completedEvents.length} completed events...`,
          );

          const results = yield* Effect.forEach(
            completedEvents,
            (event) =>
              pll.getEventDetail({ slug: event.slugname }).pipe(
                Effect.result,
                Effect.tap(() =>
                  Effect.sleep(Duration.millis(config.delayBetweenRequestsMs)),
                ),
              ),
            { concurrency: config.concurrency },
          );

          const details = results
            .filter(Result.isSuccess)
            .map((r) => r.success)
            .filter((d): d is PLLEventDetail => d !== null);

          const durationMs = Date.now() - start;
          yield* saveOutputJson(getOutputPath(year, "event-details"), details);
          yield* Effect.log(
            `     ✓ ${details.length} event details (${durationMs}ms)`,
          );

          return { data: details, count: details.length, durationMs };
        });

      /** Extracts standings for a season. @see isCriticalError for error handling. */
      const extractStandings = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📈 Extracting standings for ${year}...`);
          const result = yield* pll
            .getStandings({ year, champSeries: false })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly PLLTeamStanding[]);
          }
          yield* saveOutputJson(getOutputPath(year, "standings"), result.success.data);
          yield* Effect.log(
            `     ✓ ${result.success.count} standings (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      /** Extracts championship series standings for a season. @see isCriticalError for error handling. */
      const extractStandingsCS = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏆 Extracting champ series standings for ${year}...`,
          );
          const result = yield* pll
            .getStandingsGraphQL({ year, champSeries: true })
            .pipe(withTiming(), withRateLimitRetry(), Effect.result);
          if (Result.isFailure(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.failure._tag}]: ${result.failure.message}`,
            );
            if (isCriticalError(result.failure)) {
              return yield* Effect.fail(result.failure);
            }
            return emptyExtractResult([] as readonly PLLGraphQLStanding[]);
          }
          yield* saveOutputJson(
            getOutputPath(year, "standings-cs"),
            result.success.data,
          );
          yield* Effect.log(
            `     ✓ ${result.success.count} CS standings (${result.success.durationMs}ms)`,
          );
          return result.success;
        });

      const extractYear = (
        year: number,
        options: IncrementalExtractOptions & { includeDetails?: boolean } = {},
      ): Effect.Effect<PLLExtractionManifest, unknown> =>
        Effect.gen(function* () {
          const { includeDetails = true } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting PLL ${year}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof SeasonManifest): boolean => {
            const seasonManifest = manifestService.getSeasonManifest(
              manifest,
              year,
            );
            const entityStatus = seasonManifest[entity];
            return incremental.shouldExtract(entityStatus, year, options);
          };

          if (shouldExtract("teams")) {
            const result = yield* extractTeams(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "teams",
              result.count,
              result.durationMs,
            );
          } else {
            yield* Effect.log("  📊 Teams: skipped (already extracted)");
          }

          if (includeDetails && shouldExtract("teamDetails")) {
            const teamsPath = getOutputPath(year, "teams");
            const teamsData = yield* readJsonFile(teamsPath);
            const teams = yield* Effect.try({
              try: () => JSON.parse(teamsData) as unknown,
              catch: (e) =>
                new Error(
                  `Failed to parse teams JSON for ${year}: ${String(e)}`,
                ),
            }).pipe(
              Effect.flatMap((parsed) =>
                Schema.decodeUnknownEffect(Schema.Array(PLLTeam))(parsed),
              ),
              Effect.tap(() =>
                Effect.log(`Successfully decoded teams for ${year}`),
              ),
              Effect.catch((error) =>
                Effect.logError(`Failed to decode teams for ${year}`, error).pipe(
                  Effect.andThen(Effect.succeed([])),
                ),
              ),
            );
            if (teams.length > 0) {
              const result = yield* extractTeamDetails(year, teams);
              manifest = manifestService.markComplete(
                manifest,
                year,
                "teamDetails",
                result.count,
                result.durationMs,
              );
            }
          } else if (includeDetails) {
            yield* Effect.log("  🏟️ Team details: skipped (already extracted)");
          }

          if (shouldExtract("players")) {
            const result = yield* extractPlayers(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "players",
              result.count,
              result.durationMs,
            );
          } else {
            yield* Effect.log("  👥 Players: skipped (already extracted)");
          }

          if (shouldExtract("advancedPlayers")) {
            const result = yield* extractAdvancedPlayers(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "advancedPlayers",
              result.count,
              result.durationMs,
            );
          } else {
            yield* Effect.log(
              "  🔬 Advanced players: skipped (already extracted)",
            );
          }

          if (includeDetails && shouldExtract("playerDetails")) {
            const playersPath = getOutputPath(year, "players");
            const playersData = yield* readJsonFile(playersPath);
            const players = yield* Effect.try({
              try: () => JSON.parse(playersData) as unknown,
              catch: (e) =>
                new Error(
                  `Failed to parse players JSON for ${year}: ${String(e)}`,
                ),
            }).pipe(
              Effect.flatMap((parsed) =>
                Schema.decodeUnknownEffect(Schema.Array(PLLPlayer))(parsed),
              ),
              Effect.tap(() =>
                Effect.log(`Successfully decoded players for ${year}`),
              ),
              Effect.catch((error) =>
                Effect.logError(`Failed to decode players for ${year}`, error).pipe(
                  Effect.andThen(Effect.succeed([])),
                ),
              ),
            );
            if (players.length > 0) {
              const result = yield* extractPlayerDetails(year, players);
              manifest = manifestService.markComplete(
                manifest,
                year,
                "playerDetails",
                result.count,
                result.durationMs,
              );
            }
          } else if (includeDetails) {
            yield* Effect.log(
              "  👤 Player details: skipped (already extracted)",
            );
          }

          if (shouldExtract("events")) {
            const result = yield* extractEvents(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "events",
              result.count,
              result.durationMs,
            );
          } else {
            yield* Effect.log("  🎮 Events: skipped (already extracted)");
          }

          if (includeDetails && shouldExtract("eventDetails")) {
            const eventsPath = getOutputPath(year, "events");
            const eventsData = yield* readJsonFile(eventsPath);
            const events = yield* Effect.try({
              try: () => JSON.parse(eventsData) as unknown,
              catch: (e) =>
                new Error(
                  `Failed to parse events JSON for ${year}: ${String(e)}`,
                ),
            }).pipe(
              Effect.flatMap((parsed) =>
                Schema.decodeUnknownEffect(Schema.Array(PLLEvent))(parsed),
              ),
              Effect.tap(() =>
                Effect.log(`Successfully decoded events for ${year}`),
              ),
              Effect.catch((error) =>
                Effect.logError(`Failed to decode events for ${year}`, error).pipe(
                  Effect.andThen(Effect.succeed([])),
                ),
              ),
            );
            if (events.length > 0) {
              const result = yield* extractEventDetails(year, events);
              manifest = manifestService.markComplete(
                manifest,
                year,
                "eventDetails",
                result.count,
                result.durationMs,
              );
            }
          } else if (includeDetails) {
            yield* Effect.log(
              "  📋 Event details: skipped (already extracted)",
            );
          }

          if (shouldExtract("standings")) {
            const result = yield* extractStandings(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "standings",
              result.count,
              result.durationMs,
            );
          } else {
            yield* Effect.log("  📈 Standings: skipped (already extracted)");
          }

          if (shouldExtract("standingsCS")) {
            const result = yield* extractStandingsCS(year);
            manifest = manifestService.markComplete(
              manifest,
              year,
              "standingsCS",
              result.count,
              result.durationMs,
            );
          } else {
            yield* Effect.log("  🏆 CS Standings: skipped (already extracted)");
          }

          // Save manifest once at end of season
          yield* manifestService.save(manifest);

          return manifest;
        });

      const extractAll = (
        options: IncrementalExtractOptions & { includeDetails?: boolean } = {},
      ): Effect.Effect<PLLExtractionManifest, unknown> =>
        Effect.gen(function* () {
          yield* Effect.log("🏈 PLL Full Extraction");
          yield* Effect.log(`Output directory: ${config.outputDir}`);

          for (const year of PLL_YEARS) {
            yield* extractYear(year, options);
            yield* Effect.sleep(Duration.millis(config.delayBetweenBatchesMs));
          }

          const manifest = yield* manifestService.load;
          yield* Effect.log("\n" + "=".repeat(50));
          yield* Effect.log("EXTRACTION COMPLETE");
          yield* Effect.log("=".repeat(50));

          return manifest;
        });

      return {
        extractTeams,
        extractTeamDetails,
        extractPlayers,
        extractAdvancedPlayers,
        extractPlayerDetails,
        extractEvents,
        extractEventDetails,
        extractStandings,
        extractStandingsCS,
        extractYear,
        extractAll,
        PLL_YEARS,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(
      Layer.mergeAll(
        PLLClient.Default,
        ExtractConfigService.Default,
        PLLManifestService.Default,
        IncrementalExtractionService.Default,
        BunServices.layer,
      ),
    ),
  );
  static readonly Default = this.layer;
}
