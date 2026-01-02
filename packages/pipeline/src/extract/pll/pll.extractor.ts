import { Effect, Duration, Schema } from "effect";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { PLLClient } from "../../pll/pll.client";
import {
  PLLTeam,
  PLLPlayer,
  PLLEvent,
  type PLLTeamDetail,
  type PLLPlayerDetail,
  type PLLEventDetail,
  type PLLTeamStanding,
  type PLLGraphQLStanding,
  type PLLAdvancedPlayer,
} from "../../pll/pll.schema";
import { ExtractConfigService } from "../extract.config";
import { PLLManifestService } from "./pll.manifest";
import type { SeasonManifest } from "../extract.schema";

const PLL_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;
type _PLLYear = (typeof PLL_YEARS)[number];

interface ExtractResult<T> {
  data: T;
  count: number;
  durationMs: number;
}

const saveJson = <T>(filePath: string, data: T) =>
  Effect.gen(function* () {
    const dir = path.dirname(filePath);
    yield* Effect.tryPromise({
      try: () => fs.mkdir(dir, { recursive: true }),
      catch: (e) => new Error(`Failed to create directory: ${String(e)}`),
    });
    yield* Effect.tryPromise({
      try: () => fs.writeFile(filePath, JSON.stringify(data, null, 2)),
      catch: (e) => new Error(`Failed to write file: ${String(e)}`),
    });
  });

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

export class PLLExtractorService extends Effect.Service<PLLExtractorService>()(
  "PLLExtractorService",
  {
    effect: Effect.gen(function* () {
      const pll = yield* PLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* PLLManifestService;
      yield* Effect.log(`Output directory: ${config.outputDir}`);

      const getOutputPath = (year: number, entity: string) =>
        path.join(config.outputDir, "pll", String(year), `${entity}.json`);

      const extractTeams = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📊 Extracting teams for ${year}...`);
          const result = yield* withTiming(
            pll.getTeams({ year, includeChampSeries: true }),
          );
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
                data: [] as readonly PLLTeam[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractTeamDetails = (year: number, teams: readonly PLLTeam[]) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🏟️ Extracting team details for ${year}...`);
          const start = Date.now();

          const details: PLLTeamDetail[] = [];
          for (const team of teams) {
            const detail = yield* pll
              .getTeamDetail({
                id: team.officialId,
                year,
                statsYear: year,
                eventsYear: year,
                includeChampSeries: true,
              })
              .pipe(
                Effect.catchAll(() => Effect.succeed(null)),
                Effect.tap(() =>
                  Effect.sleep(Duration.millis(config.delayBetweenRequestsMs)),
                ),
              );
            if (detail) {
              details.push(detail);
            }
          }

          const durationMs = Date.now() - start;
          yield* saveJson(getOutputPath(year, "team-details"), details);
          yield* Effect.log(
            `     ✓ ${details.length} team details (${durationMs}ms)`,
          );

          return { data: details, count: details.length, durationMs };
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return { data: [] as PLLTeamDetail[], count: 0, durationMs: 0 };
            });
          }),
        );

      const extractPlayers = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  👥 Extracting players for ${year}...`);
          const result = yield* withTiming(
            pll.getPlayers({
              season: year,
              includeReg: true,
              includePost: true,
              includeZPP: true,
              limit: 1000,
            }),
          );
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
                data: [] as readonly PLLPlayer[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractAdvancedPlayers = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🔬 Extracting advanced players for ${year}...`);
          const result = yield* withTiming(
            pll.getAdvancedPlayers({
              year,
              limit: 500,
              league: "PLL",
            }),
          );
          yield* saveJson(getOutputPath(year, "advanced-players"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} advanced players (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly PLLAdvancedPlayer[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractPlayerDetails = (
        year: number,
        players: readonly PLLPlayer[],
      ) =>
        Effect.gen(function* () {
          yield* Effect.log(`  👤 Extracting player details for ${year}...`);
          const start = Date.now();

          const playersWithSlug = players.filter((p) => p.slug !== null);
          yield* Effect.log(
            `     Processing ${playersWithSlug.length} players with slugs...`,
          );

          const details: PLLPlayerDetail[] = [];
          let processed = 0;

          for (const player of playersWithSlug) {
            if (!player.slug) continue;

            const detail = yield* pll
              .getPlayerDetail({
                slug: player.slug,
                year,
                statsYear: year,
              })
              .pipe(
                Effect.catchAll(() => Effect.succeed(null)),
                Effect.tap(() =>
                  Effect.sleep(Duration.millis(config.delayBetweenRequestsMs)),
                ),
              );
            if (detail) {
              details.push(detail);
            }
            processed++;
            if (processed % 50 === 0) {
              yield* Effect.log(
                `     ... ${processed}/${playersWithSlug.length} processed`,
              );
            }
          }

          const durationMs = Date.now() - start;
          yield* saveJson(getOutputPath(year, "player-details"), details);
          yield* Effect.log(
            `     ✓ ${details.length} player details (${durationMs}ms)`,
          );

          return { data: details, count: details.length, durationMs };
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return { data: [] as PLLPlayerDetail[], count: 0, durationMs: 0 };
            });
          }),
        );

      const extractEvents = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  🎮 Extracting events for ${year}...`);
          const result = yield* withTiming(pll.getEvents({ year }));
          yield* saveJson(getOutputPath(year, "events"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} events (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly PLLEvent[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractEventDetails = (year: number, events: readonly PLLEvent[]) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📋 Extracting event details for ${year}...`);
          const start = Date.now();

          const completedEvents = events.filter(
            (e) => e.eventStatus === 3 && e.slugname,
          );
          yield* Effect.log(
            `     Processing ${completedEvents.length} completed events...`,
          );

          const details: PLLEventDetail[] = [];
          for (const event of completedEvents) {
            if (!event.slugname) continue;

            const detail = yield* pll
              .getEventDetail({ slug: event.slugname })
              .pipe(
                Effect.catchAll(() => Effect.succeed(null)),
                Effect.tap(() =>
                  Effect.sleep(Duration.millis(config.delayBetweenRequestsMs)),
                ),
              );
            if (detail) {
              details.push(detail);
            }
          }

          const durationMs = Date.now() - start;
          yield* saveJson(getOutputPath(year, "event-details"), details);
          yield* Effect.log(
            `     ✓ ${details.length} event details (${durationMs}ms)`,
          );

          return { data: details, count: details.length, durationMs };
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return { data: [] as PLLEventDetail[], count: 0, durationMs: 0 };
            });
          }),
        );

      const extractStandings = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`  📈 Extracting standings for ${year}...`);
          const result = yield* withTiming(
            pll.getStandings({ year, champSeries: false }),
          );
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
                data: [] as readonly PLLTeamStanding[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractStandingsCS = (year: number) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `  🏆 Extracting champ series standings for ${year}...`,
          );
          const result = yield* withTiming(
            pll.getStandingsGraphQL({ year, champSeries: true }),
          );
          yield* saveJson(getOutputPath(year, "standings-cs"), result.data);
          yield* Effect.log(
            `     ✓ ${result.count} CS standings (${result.durationMs}ms)`,
          );
          return result;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.gen(function* () {
              yield* Effect.log(`     ✗ Failed: ${e}`);
              return {
                data: [] as readonly PLLGraphQLStanding[],
                count: 0,
                durationMs: 0,
              };
            });
          }),
        );

      const extractYear = (
        year: number,
        options: {
          includeDetails?: boolean;
          skipExisting?: boolean;
        } = {},
      ) =>
        Effect.gen(function* () {
          const { includeDetails = true, skipExisting = true } = options;

          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(`Extracting PLL ${year}`);
          yield* Effect.log("=".repeat(50));

          let manifest = yield* manifestService.load;

          const shouldExtract = (entity: keyof SeasonManifest): boolean => {
            if (!skipExisting) return true;
            return !manifestService.isExtracted(manifest, year, entity);
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
            const teamsData = yield* Effect.tryPromise({
              try: () => fs.readFile(teamsPath, "utf-8"),
              catch: () => "[]",
            });
            const parsedTeams: unknown = JSON.parse(teamsData);
            const teams = yield* Schema.decodeUnknown(Schema.Array(PLLTeam))(
              parsedTeams,
            ).pipe(Effect.orElse(() => Effect.succeed([])));
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
            const playersData = yield* Effect.tryPromise({
              try: () => fs.readFile(playersPath, "utf-8"),
              catch: () => "[]",
            });
            const parsedPlayers: unknown = JSON.parse(playersData);
            const players = yield* Schema.decodeUnknown(
              Schema.Array(PLLPlayer),
            )(parsedPlayers).pipe(Effect.orElse(() => Effect.succeed([])));
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
            const eventsData = yield* Effect.tryPromise({
              try: () => fs.readFile(eventsPath, "utf-8"),
              catch: () => "[]",
            });
            const parsedEvents: unknown = JSON.parse(eventsData);
            const events = yield* Schema.decodeUnknown(Schema.Array(PLLEvent))(
              parsedEvents,
            ).pipe(Effect.orElse(() => Effect.succeed([])));
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
        options: { includeDetails?: boolean; skipExisting?: boolean } = {},
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
      PLLClient.Default,
      ExtractConfigService.Default,
      PLLManifestService.Default,
    ],
  },
) {}
