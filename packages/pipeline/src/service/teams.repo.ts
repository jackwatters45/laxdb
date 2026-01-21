import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import { and, eq, isNull } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { leagueTable } from "../db/leagues.sql";
import { playerStatTable } from "../db/player-stats.sql";
import { seasonTable } from "../db/seasons.sql";
import { sourcePlayerTable } from "../db/source-players.sql";
import { teamSeasonTable } from "../db/team-seasons.sql";
import { teamTable, type TeamSelect } from "../db/teams.sql";

/**
 * Database error for query failures
 */
export class DatabaseError extends Schema.TaggedError<DatabaseError>(
  "DatabaseError",
)("DatabaseError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  "NotFoundError",
)("NotFoundError", {
  message: Schema.String,
  resourceType: Schema.String,
  resourceId: Schema.Union(Schema.String, Schema.Number),
}) {}

/**
 * Input for getTeam query
 */
export interface GetTeamInput {
  readonly teamId: number;
}

/**
 * Input for getTeamsBySeason query
 */
export interface GetTeamsBySeasonInput {
  readonly seasonId: number;
}

/**
 * Input for getTeamsByLeague query
 */
export interface GetTeamsByLeagueInput {
  readonly leagueId: number;
  readonly seasonId?: number | undefined;
}

/**
 * Input for getTeamRoster query
 */
export interface GetTeamRosterInput {
  readonly teamId: number;
  readonly seasonId: number;
}

/**
 * Team with league info
 */
export interface TeamWithLeague extends TeamSelect {
  readonly leagueName: string;
  readonly leagueAbbreviation: string;
}

/**
 * Team with season info
 */
export interface TeamWithSeason extends TeamWithLeague {
  readonly seasonYear: number;
  readonly division: string | null;
  readonly conference: string | null;
}

/**
 * Roster player entry
 */
export interface RosterPlayer {
  readonly id: number;
  readonly sourceId: string;
  readonly fullName: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly position: string | null;
  readonly jerseyNumber: string | null;
  readonly leagueId: number;
  readonly leagueAbbreviation: string;
}

export class TeamsRepo extends Effect.Service<TeamsRepo>()("TeamsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      /**
       * Get a team by ID with league info
       */
      getTeam: (input: GetTeamInput) =>
        Effect.gen(function* () {
          const result = yield* db
            .select({
              id: teamTable.id,
              leagueId: teamTable.leagueId,
              name: teamTable.name,
              abbreviation: teamTable.abbreviation,
              city: teamTable.city,
              sourceId: teamTable.sourceId,
              sourceHash: teamTable.sourceHash,
              createdAt: teamTable.createdAt,
              updatedAt: teamTable.updatedAt,
              leagueName: leagueTable.name,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(teamTable)
            .innerJoin(leagueTable, eq(teamTable.leagueId, leagueTable.id))
            .where(eq(teamTable.id, input.teamId))
            .limit(1)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch team",
                    cause,
                  }),
              ),
            );

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({
                message: `Team with ID ${input.teamId} not found`,
                resourceType: "Team",
                resourceId: input.teamId,
              }),
            );
          }

          return result[0] as TeamWithLeague;
        }),

      /**
       * Get all teams for a specific season
       */
      getTeamsBySeason: (input: GetTeamsBySeasonInput) =>
        Effect.gen(function* () {
          const results = yield* db
            .select({
              id: teamTable.id,
              leagueId: teamTable.leagueId,
              name: teamTable.name,
              abbreviation: teamTable.abbreviation,
              city: teamTable.city,
              sourceId: teamTable.sourceId,
              sourceHash: teamTable.sourceHash,
              createdAt: teamTable.createdAt,
              updatedAt: teamTable.updatedAt,
              leagueName: leagueTable.name,
              leagueAbbreviation: leagueTable.abbreviation,
              seasonYear: seasonTable.year,
              division: teamSeasonTable.division,
              conference: teamSeasonTable.conference,
            })
            .from(teamSeasonTable)
            .innerJoin(teamTable, eq(teamSeasonTable.teamId, teamTable.id))
            .innerJoin(leagueTable, eq(teamTable.leagueId, leagueTable.id))
            .innerJoin(
              seasonTable,
              eq(teamSeasonTable.seasonId, seasonTable.id),
            )
            .where(eq(teamSeasonTable.seasonId, input.seasonId))
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch teams by season",
                    cause,
                  }),
              ),
            );

          return results as TeamWithSeason[];
        }),

      /**
       * Get all teams for a specific league, optionally filtered by season
       */
      getTeamsByLeague: (input: GetTeamsByLeagueInput) =>
        Effect.gen(function* () {
          // If seasonId provided, join through team_seasons
          if (input.seasonId !== undefined) {
            const results = yield* db
              .select({
                id: teamTable.id,
                leagueId: teamTable.leagueId,
                name: teamTable.name,
                abbreviation: teamTable.abbreviation,
                city: teamTable.city,
                sourceId: teamTable.sourceId,
                sourceHash: teamTable.sourceHash,
                createdAt: teamTable.createdAt,
                updatedAt: teamTable.updatedAt,
                leagueName: leagueTable.name,
                leagueAbbreviation: leagueTable.abbreviation,
                seasonYear: seasonTable.year,
                division: teamSeasonTable.division,
                conference: teamSeasonTable.conference,
              })
              .from(teamTable)
              .innerJoin(leagueTable, eq(teamTable.leagueId, leagueTable.id))
              .innerJoin(
                teamSeasonTable,
                eq(teamTable.id, teamSeasonTable.teamId),
              )
              .innerJoin(
                seasonTable,
                eq(teamSeasonTable.seasonId, seasonTable.id),
              )
              .where(
                and(
                  eq(teamTable.leagueId, input.leagueId),
                  eq(teamSeasonTable.seasonId, input.seasonId),
                ),
              )
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new DatabaseError({
                      message: "Failed to fetch teams by league and season",
                      cause,
                    }),
                ),
              );

            return results as TeamWithSeason[];
          }

          // No season filter - return all teams for league
          const results = yield* db
            .select({
              id: teamTable.id,
              leagueId: teamTable.leagueId,
              name: teamTable.name,
              abbreviation: teamTable.abbreviation,
              city: teamTable.city,
              sourceId: teamTable.sourceId,
              sourceHash: teamTable.sourceHash,
              createdAt: teamTable.createdAt,
              updatedAt: teamTable.updatedAt,
              leagueName: leagueTable.name,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(teamTable)
            .innerJoin(leagueTable, eq(teamTable.leagueId, leagueTable.id))
            .where(eq(teamTable.leagueId, input.leagueId))
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch teams by league",
                    cause,
                  }),
              ),
            );

          return results as TeamWithLeague[];
        }),

      /**
       * Get roster (players) for a team in a specific season
       * Uses player_stats to find players who played for the team that season
       */
      getTeamRoster: (input: GetTeamRosterInput) =>
        Effect.gen(function* () {
          const results = yield* db
            .selectDistinctOn([sourcePlayerTable.id], {
              id: sourcePlayerTable.id,
              sourceId: sourcePlayerTable.sourceId,
              fullName: sourcePlayerTable.fullName,
              firstName: sourcePlayerTable.firstName,
              lastName: sourcePlayerTable.lastName,
              position: sourcePlayerTable.position,
              jerseyNumber: sourcePlayerTable.jerseyNumber,
              leagueId: sourcePlayerTable.leagueId,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(
              and(
                eq(playerStatTable.teamId, input.teamId),
                eq(playerStatTable.seasonId, input.seasonId),
                isNull(sourcePlayerTable.deletedAt),
              ),
            )
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch team roster",
                    cause,
                  }),
              ),
            );

          return results as RosterPlayer[];
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
