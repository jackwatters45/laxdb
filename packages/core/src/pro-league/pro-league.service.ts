import { Effect, Schema } from "effect";

import { parsePostgresError } from "../util";

import {
  ProLeagueNotFoundError,
  ProSeasonNotFoundError,
} from "./pro-league.error";
import { ProLeagueRepo } from "./pro-league.repo";
import type {
  CreateLeagueInput,
  LeagueCode,
  UpsertGameInput,
  UpsertPlayerInput,
  UpsertPlayerSeasonInput,
  UpsertSeasonInput,
  UpsertStandingsInput,
  UpsertTeamInput,
} from "./pro-league.schema";
import {
  GetByLeagueAndYearInput,
  GetByLeagueInput,
  GetBySeasonInput,
  GetStandingsInput,
} from "./pro-league.schema";

export class ProLeagueService extends Effect.Service<ProLeagueService>()(
  "ProLeagueService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* ProLeagueRepo;

      return {
        // =====================================================================
        // LEAGUE OPERATIONS
        // =====================================================================

        /**
         * Get league by code (pll, nll, mll, msl, wla)
         */
        getLeagueByCode: (code: LeagueCode) =>
          repo.getLeagueByCode(code).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new ProLeagueNotFoundError({
                  message: `League not found: ${code}`,
                  code,
                }),
              ),
            ),
            Effect.tapError((e) => Effect.logError("Failed to get league", e)),
          ),

        /**
         * Create or update a league
         */
        upsertLeague: (input: CreateLeagueInput) =>
          repo.upsertLeague(input).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((league) =>
              Effect.log(`Upserted league: ${league.code}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to upsert league", e),
            ),
          ),

        /**
         * List all active leagues
         */
        listLeagues: () =>
          repo.listLeagues().pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to list leagues", e),
            ),
          ),

        // =====================================================================
        // SEASON OPERATIONS
        // =====================================================================

        /**
         * Get season by league code and year
         */
        getSeasonByLeagueAndYear: (input: GetByLeagueAndYearInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetByLeagueAndYearInput)(
              input,
            );
            const league = yield* repo.getLeagueByCode(decoded.leagueCode).pipe(
              Effect.catchTag("NoSuchElementException", () =>
                Effect.fail(
                  new ProLeagueNotFoundError({
                    message: `League not found: ${decoded.leagueCode}`,
                    code: decoded.leagueCode,
                  }),
                ),
              ),
            );
            return yield* repo.getSeasonByYear(league.id, decoded.year).pipe(
              Effect.catchTag("NoSuchElementException", () =>
                Effect.fail(
                  new ProSeasonNotFoundError({
                    message: `Season not found: ${decoded.leagueCode} ${decoded.year}`,
                    leagueId: league.id,
                    year: decoded.year,
                  }),
                ),
              ),
            );
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) => Effect.logError("Failed to get season", e)),
          ),

        /**
         * Upsert a season
         */
        upsertSeason: (input: UpsertSeasonInput) =>
          repo.upsertSeason(input).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((season) =>
              Effect.log(`Upserted season: ${season.displayName}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to upsert season", e),
            ),
          ),

        /**
         * List seasons for a league
         */
        listSeasons: (input: GetByLeagueInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetByLeagueInput)(input);
            const league = yield* repo.getLeagueByCode(decoded.leagueCode).pipe(
              Effect.catchTag("NoSuchElementException", () =>
                Effect.fail(
                  new ProLeagueNotFoundError({
                    message: `League not found: ${decoded.leagueCode}`,
                    code: decoded.leagueCode,
                  }),
                ),
              ),
            );
            return yield* repo.listSeasons(league.id);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to list seasons", e),
            ),
          ),

        // =====================================================================
        // TEAM OPERATIONS
        // =====================================================================

        /**
         * Upsert a team
         */
        upsertTeam: (input: UpsertTeamInput) =>
          repo.upsertTeam(input).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((team) => Effect.log(`Upserted team: ${team.name}`)),
            Effect.tapError((e) => Effect.logError("Failed to upsert team", e)),
          ),

        /**
         * Bulk upsert teams
         */
        bulkUpsertTeams: (inputs: UpsertTeamInput[]) =>
          repo.bulkUpsertTeams(inputs).pipe(
            Effect.tap((teams) => Effect.log(`Upserted ${teams.length} teams`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to bulk upsert teams", e),
            ),
          ),

        /**
         * List teams for a league
         */
        listTeams: (leagueId: number) =>
          repo.listTeams(leagueId).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) => Effect.logError("Failed to list teams", e)),
          ),

        /**
         * Get team by external ID
         */
        getTeamByExternalId: (leagueId: number, externalId: string) =>
          repo.getTeamByExternalId(leagueId, externalId),

        // =====================================================================
        // PLAYER OPERATIONS
        // =====================================================================

        /**
         * Upsert a player
         */
        upsertPlayer: (input: UpsertPlayerInput) =>
          repo.upsertPlayer(input).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((player) =>
              Effect.log(`Upserted player: ${player.lastName}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to upsert player", e),
            ),
          ),

        /**
         * Bulk upsert players
         */
        bulkUpsertPlayers: (inputs: UpsertPlayerInput[]) =>
          repo.bulkUpsertPlayers(inputs).pipe(
            Effect.tap((players) =>
              Effect.log(`Upserted ${players.length} players`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to bulk upsert players", e),
            ),
          ),

        /**
         * List players for a league
         */
        listPlayers: (leagueId: number) =>
          repo.listPlayers(leagueId).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to list players", e),
            ),
          ),

        /**
         * Get player by external ID
         */
        getPlayerByExternalId: (leagueId: number, externalId: string) =>
          repo.getPlayerByExternalId(leagueId, externalId),

        // =====================================================================
        // PLAYER SEASON OPERATIONS
        // =====================================================================

        /**
         * Upsert player season stats
         */
        upsertPlayerSeason: (input: UpsertPlayerSeasonInput) =>
          repo.upsertPlayerSeason(input).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to upsert player season", e),
            ),
          ),

        /**
         * Bulk upsert player season stats
         */
        bulkUpsertPlayerSeasons: (inputs: UpsertPlayerSeasonInput[]) =>
          repo.bulkUpsertPlayerSeasons(inputs).pipe(
            Effect.tap((seasons) =>
              Effect.log(`Upserted ${seasons.length} player seasons`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to bulk upsert player seasons", e),
            ),
          ),

        /**
         * Get all player seasons for a season
         */
        getPlayerSeasons: (input: GetBySeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetBySeasonInput)(input);
            return yield* repo.getPlayerSeasons(decoded.seasonId);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to get player seasons", e),
            ),
          ),

        // =====================================================================
        // GAME OPERATIONS
        // =====================================================================

        /**
         * Upsert a game
         */
        upsertGame: (input: UpsertGameInput) =>
          repo.upsertGame(input).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((game) => Effect.log(`Upserted game: ${game.publicId}`)),
            Effect.tapError((e) => Effect.logError("Failed to upsert game", e)),
          ),

        /**
         * Bulk upsert games
         */
        bulkUpsertGames: (inputs: UpsertGameInput[]) =>
          repo.bulkUpsertGames(inputs).pipe(
            Effect.tap((games) => Effect.log(`Upserted ${games.length} games`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to bulk upsert games", e),
            ),
          ),

        /**
         * List games for a season
         */
        listGames: (input: GetBySeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetBySeasonInput)(input);
            return yield* repo.listGames(decoded.seasonId);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) => Effect.logError("Failed to list games", e)),
          ),

        // =====================================================================
        // STANDINGS OPERATIONS
        // =====================================================================

        /**
         * Upsert standings
         */
        upsertStandings: (input: UpsertStandingsInput) =>
          repo.upsertStandings(input).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to upsert standings", e),
            ),
          ),

        /**
         * Bulk upsert standings
         */
        bulkUpsertStandings: (inputs: UpsertStandingsInput[]) =>
          repo.bulkUpsertStandings(inputs).pipe(
            Effect.tap((standings) =>
              Effect.log(`Upserted ${standings.length} standings entries`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to bulk upsert standings", e),
            ),
          ),

        /**
         * Get standings for a season (optionally for a specific snapshot date)
         */
        getStandings: (input: GetStandingsInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetStandingsInput)(input);
            return yield* repo.getStandings(
              decoded.seasonId,
              decoded.snapshotDate,
            );
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to get standings", e),
            ),
          ),

        // =====================================================================
        // INGESTION OPERATIONS
        // =====================================================================

        /**
         * Create a new ingestion record
         */
        createIngestion: repo.createIngestion,

        /**
         * Update an ingestion record
         */
        updateIngestion: repo.updateIngestion,

        /**
         * Get recent ingestion records for a league
         */
        getRecentIngestions: repo.getRecentIngestions,

        // =====================================================================
        // DIRECT REPO ACCESS (for pipeline use)
        // =====================================================================

        /**
         * Get league by code (returns Option-like behavior)
         */
        getLeagueByCodeOptional: repo.getLeagueByCode,

        /**
         * Get season by external ID
         */
        getSeasonByExternalId: repo.getSeasonByExternalId,

        /**
         * Get season by year
         */
        getSeasonByYear: repo.getSeasonByYear,
      } as const;
    }),
    dependencies: [ProLeagueRepo.Default],
  },
) {}
