import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Duration, Effect, Either, Layer, Schema } from "effect";

import { PLLClient } from "../../pll/pll.client";
import {
  PLLEvent,
  PLLPlayer,
  PLLTeam,
  type PLLAdvancedPlayer,
  type PLLEventDetail,
  type PLLGraphQLStanding,
  type PLLPlayerDetail,
  type PLLTeamDetail,
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

import { PLLManifestService } from "./pll.manifest";

const PLL_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

export class PLLExtractorService extends Effect.Service<PLLExtractorService>()(
  "PLLExtractorService",
  {
    effect: Effect.gen(function* () {
      const pll = yield* PLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* PLLManifestService;
      const incremental = yield* IncrementalExtractionService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (year: number, entity: string) =>
        path.join(config.outputDir, "pll", String(year), `${entity}.json`);

      const readJsonFile = (filePath: string) =>
        fs
          .readFileString(filePath, "utf-8")
          .pipe(
            Effect.catchTag("SystemError", (error) =>
              Effect.zipRight(
                Effect.logWarning(
                  `Could not read file at ${filePath}, using empty array`,
                  error,
                ),
                Effect.succeed("[]"),
              ),
            ),
          );

      /** Extracts teams for a season. @see isCriticalError for error handling. */
      const extractTeams = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for ${year}...`);
          const result = yield* pll
            .getTeams({ year, includeChampSeries: true })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly PLLTeam[]);
          }
          yield* saveJson(getOutputPath(year, "teams"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} teams (${result.right.durationMs}ms)`,
          );
          return result.right;
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
                  Effect.either,
                  Effect.tap(() =>
                    Effect.sleep(
                      Duration.millis(config.delayBetweenRequestsMs),
                    ),
                  ),
                ),
            { concurrency: config.concurrency },
          );

          const details = results
            .filter((r) => Either.isRight(r))
            .map((r) => r.right);

          const durationMs = Date.now() - start;
          yield* saveJson(getOutputPath(year, "team-details"), details);
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
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly PLLPlayer[]);
          }
          yield* saveJson(getOutputPath(year, "players"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} players (${result.right.durationMs}ms)`,
          );
          return result.right;
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
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly PLLAdvancedPlayer[]);
          }
          yield* saveJson(
            getOutputPath(year, "advanced-players"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} advanced players (${result.right.durationMs}ms)`,
          );
          return result.right;
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
                  Effect.either,
                  Effect.tap(() =>
                    Effect.sleep(
                      Duration.millis(config.delayBetweenRequestsMs),
                    ),
                  ),
                ),
            { concurrency: config.concurrency },
          );

          const details = results
            .filter(Either.isRight)
            .map((r) => r.right)
            .filter((d): d is PLLPlayerDetail => d !== null);

          const durationMs = Date.now() - start;
          yield* saveJson(getOutputPath(year, "player-details"), details);
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
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly PLLEvent[]);
          }
          yield* saveJson(getOutputPath(year, "events"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} events (${result.right.durationMs}ms)`,
          );
          return result.right;
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
                Effect.either,
                Effect.tap(() =>
                  Effect.sleep(Duration.millis(config.delayBetweenRequestsMs)),
                ),
              ),
            { concurrency: config.concurrency },
          );

          const details = results
            .filter(Either.isRight)
            .map((r) => r.right)
            .filter((d): d is PLLEventDetail => d !== null);

          const durationMs = Date.now() - start;
          yield* saveJson(getOutputPath(year, "event-details"), details);
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
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly PLLTeamStanding[]);
          }
          yield* saveJson(getOutputPath(year, "standings"), result.right.data);
          yield* Effect.log(
            `     ✓ ${result.right.count} standings (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      /** Extracts championship series standings for a season. @see isCriticalError for error handling. */
      const extractStandingsCS = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏆 Extracting champ series standings for ${year}...`,
          );
          const result = yield* pll
            .getStandingsGraphQL({ year, champSeries: true })
            .pipe(withTiming(), withRateLimitRetry(), Effect.either);
          if (Either.isLeft(result)) {
            yield* Effect.log(
              `     ✗ Failed [${result.left._tag}]: ${result.left.message}`,
            );
            if (isCriticalError(result.left)) {
              return yield* Effect.fail(result.left);
            }
            return emptyExtractResult([] as readonly PLLGraphQLStanding[]);
          }
          yield* saveJson(
            getOutputPath(year, "standings-cs"),
            result.right.data,
          );
          yield* Effect.log(
            `     ✓ ${result.right.count} CS standings (${result.right.durationMs}ms)`,
          );
          return result.right;
        });

      const extractYear = (
        year: number,
        options: IncrementalExtractOptions & { includeDetails?: boolean } = {},
      ) =>
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
            yield* manifestService.save(manifest);
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
                Schema.decodeUnknown(Schema.Array(PLLTeam))(parsed),
              ),
              Effect.tap(() =>
                Effect.log(`Successfully decoded teams for ${year}`),
              ),
              Effect.catchAll((error) =>
                Effect.zipRight(
                  Effect.logError(`Failed to decode teams for ${year}`, error),
                  Effect.succeed([]),
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
              yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
                Schema.decodeUnknown(Schema.Array(PLLPlayer))(parsed),
              ),
              Effect.tap(() =>
                Effect.log(`Successfully decoded players for ${year}`),
              ),
              Effect.catchAll((error) =>
                Effect.zipRight(
                  Effect.logError(
                    `Failed to decode players for ${year}`,
                    error,
                  ),
                  Effect.succeed([]),
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
              yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
                Schema.decodeUnknown(Schema.Array(PLLEvent))(parsed),
              ),
              Effect.tap(() =>
                Effect.log(`Successfully decoded events for ${year}`),
              ),
              Effect.catchAll((error) =>
                Effect.zipRight(
                  Effect.logError(`Failed to decode events for ${year}`, error),
                  Effect.succeed([]),
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
              yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
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
            yield* manifestService.save(manifest);
          } else {
            yield* Effect.log("  🏆 CS Standings: skipped (already extracted)");
          }

          return manifest;
        });

      const extractAll = (
        options: IncrementalExtractOptions & { includeDetails?: boolean } = {},
      ) =>
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
    dependencies: [
      Layer.mergeAll(
        PLLClient.Default,
        ExtractConfigService.Default,
        PLLManifestService.Default,
        IncrementalExtractionService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
