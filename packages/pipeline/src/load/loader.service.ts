import { createHash } from "node:crypto";

import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import { eq, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { gameTable, type GameInsert } from "../db/games.sql";
import { leagueTable, type LeagueInsert } from "../db/leagues.sql";
import { playerStatTable, type PlayerStatInsert } from "../db/player-stats.sql";
import { seasonTable, type SeasonInsert } from "../db/seasons.sql";
import {
  sourcePlayerTable,
  type SourcePlayerInsert,
} from "../db/source-players.sql";
import { teamSeasonTable } from "../db/team-seasons.sql";
import { teamTable, type TeamInsert } from "../db/teams.sql";
import { ExtractConfigService } from "../extract/extract.config";
import { IdentityService, normalizeName } from "../service/identity.service";

/**
 * Service-level error for loader operations
 */
export class LoaderServiceError extends Schema.TaggedError<LoaderServiceError>(
  "LoaderServiceError",
)("LoaderServiceError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Error when input file is not found
 */
export class FileNotFoundError extends Schema.TaggedError<FileNotFoundError>(
  "FileNotFoundError",
)("FileNotFoundError", {
  message: Schema.String,
  filePath: Schema.String,
}) {}

/**
 * Error when JSON parsing fails
 */
export class JsonParseError extends Schema.TaggedError<JsonParseError>(
  "JsonParseError",
)("JsonParseError", {
  message: Schema.String,
  filePath: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * League configuration for loading
 */
export interface LeagueConfig {
  readonly name: string;
  readonly abbreviation: string;
  readonly priority: number;
  readonly outputDir: string;
}

/**
 * Standard league configurations
 */
export const LEAGUE_CONFIGS: Record<string, LeagueConfig> = {
  pll: {
    name: "Premier Lacrosse League",
    abbreviation: "PLL",
    priority: 1,
    outputDir: "pll",
  },
  nll: {
    name: "National Lacrosse League",
    abbreviation: "NLL",
    priority: 2,
    outputDir: "nll",
  },
  mll: {
    name: "Major League Lacrosse",
    abbreviation: "MLL",
    priority: 4, // Uses StatsCrew
    outputDir: "mll",
  },
  msl: {
    name: "Major Series Lacrosse",
    abbreviation: "MSL",
    priority: 3, // Uses Gamesheet
    outputDir: "msl",
  },
  wla: {
    name: "Western Lacrosse Association",
    abbreviation: "WLA",
    priority: 5, // Uses Pointstreak
    outputDir: "wla",
  },
};

/**
 * Result of a load operation
 */
export interface LoadResult {
  readonly entityType: string;
  readonly loaded: number;
  readonly skipped: number;
  readonly errors: number;
  readonly durationMs: number;
}

/**
 * Generate SHA-256 hash for change detection
 */
function generateSourceHash(data: unknown): string {
  const content = JSON.stringify(data, Object.keys(data as object).toSorted());
  return createHash("sha256").update(content).digest("hex");
}

/**
 * PLL Player from extracted JSON
 */
interface PLLPlayerJson {
  officialId: string;
  firstName: string;
  lastName: string;
  lastNameSuffix?: string | null;
  jerseyNum?: number | null;
  handedness?: string | null;
  allTeams: Array<{
    officialId: string;
    position?: string | null;
    positionName?: string | null;
    jerseyNum?: number | null;
    year: number;
    fullName: string;
  }>;
  stats?: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    shots: number;
    shotsOnGoal: number;
    groundBalls: number;
    turnovers: number;
    causedTurnovers: number;
    faceoffsWon: number;
    faceoffsLost: number;
    saves: number;
    goalsAgainst: number;
  } | null;
}

/**
 * PLL Team from extracted JSON
 */
interface PLLTeamJson {
  officialId: string;
  locationCode?: string | null;
  location?: string | null;
  fullName: string;
}

/**
 * PLL Event from extracted JSON
 */
interface PLLEventJson {
  id: number;
  slugname?: string | null;
  year: number;
  startTime?: string | null;
  venue?: string | null;
  eventStatus?: number | null;
  homeScore?: number | null;
  visitorScore?: number | null;
  homeTeam?: { officialId: string } | null;
  awayTeam?: { officialId: string } | null;
}

export class LoaderService extends Effect.Service<LoaderService>()(
  "LoaderService",
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;
      const config = yield* ExtractConfigService;
      const identityService = yield* IdentityService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      yield* Effect.log(`Loader output directory: ${config.outputDir}`);

      /**
       * Read and parse JSON file from output directory
       */
      const readJsonFile = <T>(
        filePath: string,
      ): Effect.Effect<
        T,
        FileNotFoundError | JsonParseError | LoaderServiceError
      > =>
        Effect.gen(function* () {
          const exists = yield* fs.exists(filePath).pipe(
            Effect.mapError(
              (cause) =>
                new LoaderServiceError({
                  message: `Failed to check file existence: ${filePath}`,
                  cause,
                }),
            ),
          );
          if (!exists) {
            return yield* Effect.fail(
              new FileNotFoundError({
                message: `File not found: ${filePath}`,
                filePath,
              }),
            );
          }

          const content = yield* fs.readFileString(filePath, "utf-8").pipe(
            Effect.mapError(
              (cause) =>
                new LoaderServiceError({
                  message: `Failed to read file: ${filePath}`,
                  cause,
                }),
            ),
          );

          const parsed = yield* Effect.try({
            try: () => JSON.parse(content) as T,
            catch: (e) =>
              new JsonParseError({
                message: `Failed to parse JSON: ${filePath}`,
                filePath,
                cause: e,
              }),
          });

          return parsed;
        });

      /**
       * Ensure league exists in database, return league ID
       */
      const ensureLeague = (leagueKey: string) =>
        Effect.gen(function* () {
          const leagueConfig = LEAGUE_CONFIGS[leagueKey];
          if (!leagueConfig) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: `Unknown league: ${leagueKey}`,
              }),
            );
          }

          // Check if league exists
          const existing = yield* db
            .select({ id: leagueTable.id })
            .from(leagueTable)
            .where(eq(leagueTable.abbreviation, leagueConfig.abbreviation))
            .limit(1)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to query league",
                    cause,
                  }),
              ),
            );

          if (existing.length > 0 && existing[0]) {
            return existing[0].id;
          }

          // Insert league
          const insert: LeagueInsert = {
            name: leagueConfig.name,
            abbreviation: leagueConfig.abbreviation,
            priority: leagueConfig.priority,
            active: true,
          };

          const [result] = yield* db
            .insert(leagueTable)
            .values(insert)
            .returning({ id: leagueTable.id })
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to insert league",
                    cause,
                  }),
              ),
            );

          if (!result) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: "Failed to insert league: no ID returned",
              }),
            );
          }

          yield* Effect.log(`Created league: ${leagueConfig.abbreviation}`);
          return result.id;
        });

      /**
       * Ensure season exists in database, return season ID
       */
      const ensureSeason = (
        leagueId: number,
        year: number,
        sourceSeasonId?: string,
      ) =>
        Effect.gen(function* () {
          // Check if season exists
          const existing = yield* db
            .select({ id: seasonTable.id })
            .from(seasonTable)
            .where(
              sql`${seasonTable.leagueId} = ${leagueId} AND ${seasonTable.year} = ${year}`,
            )
            .limit(1)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to query season",
                    cause,
                  }),
              ),
            );

          if (existing.length > 0 && existing[0]) {
            return existing[0].id;
          }

          // Insert season
          const insert: SeasonInsert = {
            leagueId,
            year,
            name: `${year}`,
            sourceSeasonId: sourceSeasonId ?? String(year),
            active: true,
          };

          const [result] = yield* db
            .insert(seasonTable)
            .values(insert)
            .returning({ id: seasonTable.id })
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to insert season",
                    cause,
                  }),
              ),
            );

          if (!result) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: "Failed to insert season: no ID returned",
              }),
            );
          }

          yield* Effect.log(`Created season: ${year}`);
          return result.id;
        });

      /**
       * Load teams from extracted JSON
       */
      const loadTeams = (
        leagueKey: string,
        season: string,
      ): Effect.Effect<
        LoadResult,
        LoaderServiceError | FileNotFoundError | JsonParseError
      > =>
        Effect.gen(function* () {
          const start = Date.now();
          const leagueConfig = LEAGUE_CONFIGS[leagueKey];
          if (!leagueConfig) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: `Unknown league: ${leagueKey}`,
              }),
            );
          }

          const filePath = path.join(
            config.outputDir,
            leagueConfig.outputDir,
            season,
            "teams.json",
          );
          yield* Effect.log(`Loading teams from: ${filePath}`);

          const teams = yield* readJsonFile<PLLTeamJson[]>(filePath);
          const leagueId = yield* ensureLeague(leagueKey);
          const seasonId = yield* ensureSeason(leagueId, Number(season));

          let loaded = 0;
          let skipped = 0;
          let errors = 0;

          for (const team of teams) {
            const sourceHash = generateSourceHash(team);

            // Check if team exists with same hash (idempotent upsert)
            const existing = yield* db
              .select({
                id: teamTable.id,
                sourceHash: teamTable.sourceHash,
              })
              .from(teamTable)
              .where(
                sql`${teamTable.leagueId} = ${leagueId} AND ${teamTable.sourceId} = ${team.officialId}`,
              )
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new LoaderServiceError({
                      message: "Failed to query team",
                      cause,
                    }),
                ),
              );

            if (existing.length > 0 && existing[0]?.sourceHash === sourceHash) {
              skipped++;
              continue;
            }

            const teamInsert: TeamInsert = {
              leagueId,
              name: team.fullName,
              abbreviation: team.locationCode ?? null,
              city: team.location ?? null,
              sourceId: team.officialId,
              sourceHash,
            };

            if (existing.length > 0 && existing[0]) {
              // Update existing
              yield* db
                .update(teamTable)
                .set({
                  name: teamInsert.name,
                  abbreviation: teamInsert.abbreviation,
                  city: teamInsert.city,
                  sourceHash: teamInsert.sourceHash,
                })
                .where(eq(teamTable.id, existing[0].id))
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to update team",
                        cause,
                      }),
                  ),
                );

              // Ensure team_season exists
              yield* db
                .insert(teamSeasonTable)
                .values({ teamId: existing[0].id, seasonId })
                .onConflictDoNothing()
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to insert team_season",
                        cause,
                      }),
                  ),
                );

              loaded++;
            } else {
              // Insert new
              const [result] = yield* db
                .insert(teamTable)
                .values(teamInsert)
                .returning({ id: teamTable.id })
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to insert team",
                        cause,
                      }),
                  ),
                );

              if (result) {
                // Create team_season link
                yield* db
                  .insert(teamSeasonTable)
                  .values({ teamId: result.id, seasonId })
                  .onConflictDoNothing()
                  .pipe(
                    Effect.mapError(
                      (cause) =>
                        new LoaderServiceError({
                          message: "Failed to insert team_season",
                          cause,
                        }),
                    ),
                  );
                loaded++;
              } else {
                errors++;
              }
            }
          }

          const durationMs = Date.now() - start;
          yield* Effect.log(
            `Loaded ${loaded} teams, skipped ${skipped}, errors ${errors} (${durationMs}ms)`,
          );

          return { entityType: "teams", loaded, skipped, errors, durationMs };
        });

      /**
       * Load players from extracted JSON
       */
      const loadPlayers = (
        leagueKey: string,
        season: string,
      ): Effect.Effect<
        LoadResult,
        LoaderServiceError | FileNotFoundError | JsonParseError
      > =>
        Effect.gen(function* () {
          const start = Date.now();
          const leagueConfig = LEAGUE_CONFIGS[leagueKey];
          if (!leagueConfig) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: `Unknown league: ${leagueKey}`,
              }),
            );
          }

          const filePath = path.join(
            config.outputDir,
            leagueConfig.outputDir,
            season,
            "players.json",
          );
          yield* Effect.log(`Loading players from: ${filePath}`);

          const players = yield* readJsonFile<PLLPlayerJson[]>(filePath);
          const leagueId = yield* ensureLeague(leagueKey);

          let loaded = 0;
          let skipped = 0;
          let errors = 0;

          for (const player of players) {
            const sourceHash = generateSourceHash(player);

            // Check if player exists with same hash
            const existing = yield* db
              .select({
                id: sourcePlayerTable.id,
                sourceHash: sourcePlayerTable.sourceHash,
              })
              .from(sourcePlayerTable)
              .where(
                sql`${sourcePlayerTable.leagueId} = ${leagueId} AND ${sourcePlayerTable.sourceId} = ${player.officialId}`,
              )
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new LoaderServiceError({
                      message: "Failed to query player",
                      cause,
                    }),
                ),
              );

            if (existing.length > 0 && existing[0]?.sourceHash === sourceHash) {
              skipped++;
              continue;
            }

            // Build full name
            const fullName = player.lastNameSuffix
              ? `${player.firstName} ${player.lastName} ${player.lastNameSuffix}`
              : `${player.firstName} ${player.lastName}`;

            // Get position from first team entry for this season
            const seasonTeam = player.allTeams.find(
              (t) => String(t.year) === season,
            );

            const playerInsert: SourcePlayerInsert = {
              leagueId,
              sourceId: player.officialId,
              firstName: player.firstName,
              lastName: player.lastName,
              fullName,
              normalizedName: normalizeName(fullName),
              position: seasonTeam?.position ?? null,
              jerseyNumber: player.jerseyNum?.toString() ?? null,
              handedness: player.handedness ?? null,
              sourceHash,
            };

            if (existing.length > 0 && existing[0]) {
              // Update existing
              yield* db
                .update(sourcePlayerTable)
                .set({
                  firstName: playerInsert.firstName,
                  lastName: playerInsert.lastName,
                  fullName: playerInsert.fullName,
                  normalizedName: playerInsert.normalizedName,
                  position: playerInsert.position,
                  jerseyNumber: playerInsert.jerseyNumber,
                  handedness: playerInsert.handedness,
                  sourceHash: playerInsert.sourceHash,
                })
                .where(eq(sourcePlayerTable.id, existing[0].id))
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to update player",
                        cause,
                      }),
                  ),
                );
              loaded++;
            } else {
              // Insert new
              const result = yield* db
                .insert(sourcePlayerTable)
                .values(playerInsert)
                .returning({ id: sourcePlayerTable.id })
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to insert player",
                        cause,
                      }),
                  ),
                );

              if (result.length > 0) {
                loaded++;
              } else {
                errors++;
              }
            }
          }

          const durationMs = Date.now() - start;
          yield* Effect.log(
            `Loaded ${loaded} players, skipped ${skipped}, errors ${errors} (${durationMs}ms)`,
          );

          return { entityType: "players", loaded, skipped, errors, durationMs };
        });

      /**
       * Load player stats from extracted JSON
       */
      const loadStats = (
        leagueKey: string,
        season: string,
      ): Effect.Effect<
        LoadResult,
        LoaderServiceError | FileNotFoundError | JsonParseError
      > =>
        Effect.gen(function* () {
          const start = Date.now();
          const leagueConfig = LEAGUE_CONFIGS[leagueKey];
          if (!leagueConfig) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: `Unknown league: ${leagueKey}`,
              }),
            );
          }

          const filePath = path.join(
            config.outputDir,
            leagueConfig.outputDir,
            season,
            "players.json",
          );
          yield* Effect.log(`Loading stats from: ${filePath}`);

          const players = yield* readJsonFile<PLLPlayerJson[]>(filePath);
          const leagueId = yield* ensureLeague(leagueKey);
          const seasonId = yield* ensureSeason(leagueId, Number(season));

          let loaded = 0;
          let skipped = 0;
          let errors = 0;

          // Build team lookup map
          const teamLookup = new Map<string, number>();
          const teams = yield* db
            .select({ id: teamTable.id, sourceId: teamTable.sourceId })
            .from(teamTable)
            .where(eq(teamTable.leagueId, leagueId))
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to query teams",
                    cause,
                  }),
              ),
            );
          for (const team of teams) {
            if (team.sourceId) {
              teamLookup.set(team.sourceId, team.id);
            }
          }

          // Build player lookup map
          const playerLookup = new Map<string, number>();
          const dbPlayers = yield* db
            .select({
              id: sourcePlayerTable.id,
              sourceId: sourcePlayerTable.sourceId,
            })
            .from(sourcePlayerTable)
            .where(eq(sourcePlayerTable.leagueId, leagueId))
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to query players",
                    cause,
                  }),
              ),
            );
          for (const player of dbPlayers) {
            playerLookup.set(player.sourceId, player.id);
          }

          for (const player of players) {
            if (!player.stats) {
              skipped++;
              continue;
            }

            const sourcePlayerId = playerLookup.get(player.officialId);
            if (!sourcePlayerId) {
              yield* Effect.log(
                `Player not found for stats: ${player.officialId}`,
              );
              errors++;
              continue;
            }

            // Get team from player's team list for this season
            const seasonTeam = player.allTeams.find(
              (t) => String(t.year) === season,
            );
            const teamId = seasonTeam
              ? teamLookup.get(seasonTeam.officialId)
              : undefined;
            if (!teamId) {
              yield* Effect.log(
                `Team not found for player ${player.officialId}: ${seasonTeam?.officialId}`,
              );
              errors++;
              continue;
            }

            const sourceHash = generateSourceHash(player.stats);

            // Check if stats exist with same hash
            const existing = yield* db
              .select({
                id: playerStatTable.id,
                sourceHash: playerStatTable.sourceHash,
              })
              .from(playerStatTable)
              .where(
                sql`${playerStatTable.sourcePlayerId} = ${sourcePlayerId} AND ${playerStatTable.seasonId} = ${seasonId} AND ${playerStatTable.gameId} IS NULL`,
              )
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new LoaderServiceError({
                      message: "Failed to query player stats",
                      cause,
                    }),
                ),
              );

            if (existing.length > 0 && existing[0]?.sourceHash === sourceHash) {
              skipped++;
              continue;
            }

            const statInsert: PlayerStatInsert = {
              sourcePlayerId,
              seasonId,
              teamId,
              gameId: null, // Season totals
              statType: "regular",
              goals: player.stats.goals,
              assists: player.stats.assists,
              points: player.stats.points,
              shots: player.stats.shots,
              shotsOnGoal: player.stats.shotsOnGoal,
              groundBalls: player.stats.groundBalls,
              turnovers: player.stats.turnovers,
              causedTurnovers: player.stats.causedTurnovers,
              faceoffWins: player.stats.faceoffsWon,
              faceoffLosses: player.stats.faceoffsLost,
              saves: player.stats.saves,
              goalsAgainst: player.stats.goalsAgainst,
              gamesPlayed: player.stats.gamesPlayed,
              sourceHash,
            };

            if (existing.length > 0 && existing[0]) {
              // Update existing
              yield* db
                .update(playerStatTable)
                .set({
                  teamId: statInsert.teamId,
                  goals: statInsert.goals,
                  assists: statInsert.assists,
                  points: statInsert.points,
                  shots: statInsert.shots,
                  shotsOnGoal: statInsert.shotsOnGoal,
                  groundBalls: statInsert.groundBalls,
                  turnovers: statInsert.turnovers,
                  causedTurnovers: statInsert.causedTurnovers,
                  faceoffWins: statInsert.faceoffWins,
                  faceoffLosses: statInsert.faceoffLosses,
                  saves: statInsert.saves,
                  goalsAgainst: statInsert.goalsAgainst,
                  gamesPlayed: statInsert.gamesPlayed,
                  sourceHash: statInsert.sourceHash,
                })
                .where(eq(playerStatTable.id, existing[0].id))
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to update player stats",
                        cause,
                      }),
                  ),
                );
              loaded++;
            } else {
              // Insert new
              const result = yield* db
                .insert(playerStatTable)
                .values(statInsert)
                .returning({ id: playerStatTable.id })
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to insert player stats",
                        cause,
                      }),
                  ),
                );

              if (result.length > 0) {
                loaded++;
              } else {
                errors++;
              }
            }
          }

          const durationMs = Date.now() - start;
          yield* Effect.log(
            `Loaded ${loaded} stats, skipped ${skipped}, errors ${errors} (${durationMs}ms)`,
          );

          return { entityType: "stats", loaded, skipped, errors, durationMs };
        });

      /**
       * Load games from extracted JSON
       */
      const loadGames = (
        leagueKey: string,
        season: string,
      ): Effect.Effect<
        LoadResult,
        LoaderServiceError | FileNotFoundError | JsonParseError
      > =>
        Effect.gen(function* () {
          const start = Date.now();
          const leagueConfig = LEAGUE_CONFIGS[leagueKey];
          if (!leagueConfig) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: `Unknown league: ${leagueKey}`,
              }),
            );
          }

          const filePath = path.join(
            config.outputDir,
            leagueConfig.outputDir,
            season,
            "events.json",
          );
          yield* Effect.log(`Loading games from: ${filePath}`);

          const events = yield* readJsonFile<PLLEventJson[]>(filePath);
          const leagueId = yield* ensureLeague(leagueKey);
          const seasonId = yield* ensureSeason(leagueId, Number(season));

          // Build team lookup map
          const teamLookup = new Map<string, number>();
          const teams = yield* db
            .select({ id: teamTable.id, sourceId: teamTable.sourceId })
            .from(teamTable)
            .where(eq(teamTable.leagueId, leagueId))
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to query teams",
                    cause,
                  }),
              ),
            );
          for (const team of teams) {
            if (team.sourceId) {
              teamLookup.set(team.sourceId, team.id);
            }
          }

          let loaded = 0;
          let skipped = 0;
          let errors = 0;

          for (const event of events) {
            if (!event.homeTeam || !event.awayTeam) {
              skipped++;
              continue;
            }

            const homeTeamId = teamLookup.get(event.homeTeam.officialId);
            const awayTeamId = teamLookup.get(event.awayTeam.officialId);

            if (!homeTeamId || !awayTeamId) {
              yield* Effect.log(
                `Team not found for game ${event.id}: home=${event.homeTeam.officialId}, away=${event.awayTeam.officialId}`,
              );
              errors++;
              continue;
            }

            const sourceHash = generateSourceHash(event);
            const sourceId = String(event.id);

            // Check if game exists with same hash
            const existing = yield* db
              .select({
                id: gameTable.id,
                sourceHash: gameTable.sourceHash,
              })
              .from(gameTable)
              .where(eq(gameTable.sourceId, sourceId))
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new LoaderServiceError({
                      message: "Failed to query game",
                      cause,
                    }),
                ),
              );

            if (existing.length > 0 && existing[0]?.sourceHash === sourceHash) {
              skipped++;
              continue;
            }

            // Parse game date from startTime
            let gameDate = new Date();
            if (event.startTime) {
              const parsed = new Date(event.startTime);
              if (!Number.isNaN(parsed.getTime())) {
                gameDate = parsed;
              }
            }

            // Map event status to game status
            let status: string = "scheduled";
            if (event.eventStatus === 3) {
              status = "final";
            } else if (event.eventStatus === 2) {
              status = "in_progress";
            }

            const gameInsert: GameInsert = {
              seasonId,
              homeTeamId,
              awayTeamId,
              gameDate,
              venue: event.venue ?? null,
              homeScore: event.homeScore ?? null,
              awayScore: event.visitorScore ?? null,
              status,
              sourceId,
              sourceHash,
            };

            if (existing.length > 0 && existing[0]) {
              // Update existing
              yield* db
                .update(gameTable)
                .set({
                  homeTeamId: gameInsert.homeTeamId,
                  awayTeamId: gameInsert.awayTeamId,
                  gameDate: gameInsert.gameDate,
                  venue: gameInsert.venue,
                  homeScore: gameInsert.homeScore,
                  awayScore: gameInsert.awayScore,
                  status: gameInsert.status,
                  sourceHash: gameInsert.sourceHash,
                })
                .where(eq(gameTable.id, existing[0].id))
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to update game",
                        cause,
                      }),
                  ),
                );
              loaded++;
            } else {
              // Insert new
              const result = yield* db
                .insert(gameTable)
                .values(gameInsert)
                .returning({ id: gameTable.id })
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new LoaderServiceError({
                        message: "Failed to insert game",
                        cause,
                      }),
                  ),
                );

              if (result.length > 0) {
                loaded++;
              } else {
                errors++;
              }
            }
          }

          const durationMs = Date.now() - start;
          yield* Effect.log(
            `Loaded ${loaded} games, skipped ${skipped}, errors ${errors} (${durationMs}ms)`,
          );

          return { entityType: "games", loaded, skipped, errors, durationMs };
        });

      /**
       * Run identity linking for all unlinked players
       */
      const runIdentityLinking = (
        leagueKey: string,
      ): Effect.Effect<LoadResult, LoaderServiceError> =>
        Effect.gen(function* () {
          const start = Date.now();
          const leagueConfig = LEAGUE_CONFIGS[leagueKey];
          if (!leagueConfig) {
            return yield* Effect.fail(
              new LoaderServiceError({
                message: `Unknown league: ${leagueKey}`,
              }),
            );
          }

          const leagueId = yield* ensureLeague(leagueKey);

          // Get unlinked players (using NOT EXISTS instead of LEFT JOIN)
          const unlinkedPlayers = yield* db
            .select({ id: sourcePlayerTable.id })
            .from(sourcePlayerTable)
            .where(
              sql`${sourcePlayerTable.leagueId} = ${leagueId}
                  AND ${sourcePlayerTable.deletedAt} IS NULL
                  AND NOT EXISTS (
                    SELECT 1 FROM pipeline_player_identity pi
                    WHERE pi.source_player_id = ${sourcePlayerTable.id}
                  )`,
            )
            .pipe(
              Effect.mapError(
                (cause) =>
                  new LoaderServiceError({
                    message: "Failed to query unlinked players",
                    cause,
                  }),
              ),
            );

          yield* Effect.log(
            `Found ${unlinkedPlayers.length} unlinked players for ${leagueConfig.abbreviation}`,
          );

          let loaded = 0;
          let skipped = 0;
          let errors = 0;

          for (const player of unlinkedPlayers) {
            const result = yield* identityService
              .processIdentity(player.id)
              .pipe(
                Effect.catchTag("AlreadyLinkedError", () =>
                  Effect.succeed({ skipped: true }),
                ),
                Effect.catchTag("SourcePlayerNotFoundError", () =>
                  Effect.succeed({ error: true }),
                ),
                Effect.catchTag("NoExactMatchDataError", () =>
                  Effect.succeed({ skipped: true }),
                ),
                Effect.catchTag("IdentityServiceError", (e) => {
                  return Effect.zipRight(
                    Effect.logWarning(`Identity linking error: ${e.message}`),
                    Effect.succeed({ error: true }),
                  );
                }),
              );

            if ("skipped" in result) {
              skipped++;
            } else if ("error" in result) {
              errors++;
            } else {
              loaded++;
            }
          }

          const durationMs = Date.now() - start;
          yield* Effect.log(
            `Identity linking: ${loaded} linked, ${skipped} skipped, ${errors} errors (${durationMs}ms)`,
          );

          return {
            entityType: "identity",
            loaded,
            skipped,
            errors,
            durationMs,
          };
        });

      /**
       * Load a full season for a league
       */
      const loadSeason = (
        leagueKey: string,
        season: string,
        options: { runIdentityLinking?: boolean } = {},
      ): Effect.Effect<
        LoadResult[],
        LoaderServiceError | FileNotFoundError | JsonParseError
      > =>
        Effect.gen(function* () {
          yield* Effect.log(`\n${"=".repeat(50)}`);
          yield* Effect.log(
            `Loading ${leagueKey.toUpperCase()} season ${season}`,
          );
          yield* Effect.log("=".repeat(50));

          const results: LoadResult[] = [];

          // Load teams first
          const teamsResult = yield* loadTeams(leagueKey, season).pipe(
            Effect.catchTag("FileNotFoundError", (e) => {
              return Effect.zipRight(
                Effect.logWarning(`Teams file not found: ${e.filePath}`),
                Effect.succeed({
                  entityType: "teams",
                  loaded: 0,
                  skipped: 0,
                  errors: 0,
                  durationMs: 0,
                }),
              );
            }),
          );
          results.push(teamsResult);

          // Load players
          const playersResult = yield* loadPlayers(leagueKey, season).pipe(
            Effect.catchTag("FileNotFoundError", (e) => {
              return Effect.zipRight(
                Effect.logWarning(`Players file not found: ${e.filePath}`),
                Effect.succeed({
                  entityType: "players",
                  loaded: 0,
                  skipped: 0,
                  errors: 0,
                  durationMs: 0,
                }),
              );
            }),
          );
          results.push(playersResult);

          // Load stats
          const statsResult = yield* loadStats(leagueKey, season).pipe(
            Effect.catchTag("FileNotFoundError", (e) => {
              return Effect.zipRight(
                Effect.logWarning(`Stats file not found: ${e.filePath}`),
                Effect.succeed({
                  entityType: "stats",
                  loaded: 0,
                  skipped: 0,
                  errors: 0,
                  durationMs: 0,
                }),
              );
            }),
          );
          results.push(statsResult);

          // Load games
          const gamesResult = yield* loadGames(leagueKey, season).pipe(
            Effect.catchTag("FileNotFoundError", (e) => {
              return Effect.zipRight(
                Effect.logWarning(`Games file not found: ${e.filePath}`),
                Effect.succeed({
                  entityType: "games",
                  loaded: 0,
                  skipped: 0,
                  errors: 0,
                  durationMs: 0,
                }),
              );
            }),
          );
          results.push(gamesResult);

          // Run identity linking if requested
          if (options.runIdentityLinking) {
            const identityResult = yield* runIdentityLinking(leagueKey);
            results.push(identityResult);
          }

          // Summary
          const totalLoaded = results.reduce((sum, r) => sum + r.loaded, 0);
          const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
          const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
          const totalDuration = results.reduce(
            (sum, r) => sum + r.durationMs,
            0,
          );

          yield* Effect.log(`\n--- Summary ---`);
          yield* Effect.log(
            `Total: ${totalLoaded} loaded, ${totalSkipped} skipped, ${totalErrors} errors (${totalDuration}ms)`,
          );

          return results;
        });

      return {
        ensureLeague,
        ensureSeason,
        loadTeams,
        loadPlayers,
        loadStats,
        loadGames,
        runIdentityLinking,
        loadSeason,
        LEAGUE_CONFIGS,
      };
    }),
    dependencies: [
      Layer.mergeAll(
        DatabaseLive,
        ExtractConfigService.Default,
        IdentityService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
