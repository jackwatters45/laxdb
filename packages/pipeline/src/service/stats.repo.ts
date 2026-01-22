import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { leagueTable } from "../db/leagues.sql";
import { playerStatTable, type PlayerStatSelect } from "../db/player-stats.sql";
import { seasonTable } from "../db/seasons.sql";
import { sourcePlayerTable } from "../db/source-players.sql";
import { teamTable } from "../db/teams.sql";

/**
 * Cursor for pagination (points, then id for stable ordering)
 */
export interface StatsCursor {
  readonly points: number;
  readonly id: number;
}

/**
 * Common input for paginated queries
 */
export interface PaginationInput {
  readonly cursor?: StatsCursor | undefined;
  readonly limit: number;
}

/**
 * Input for getPlayerStats query
 */
export interface GetPlayerStatsInput extends PaginationInput {
  readonly sourcePlayerId: number;
}

/**
 * Input for getPlayerStatsBySeason query
 */
export interface GetPlayerStatsBySeasonInput extends PaginationInput {
  readonly sourcePlayerId: number;
  readonly seasonId: number;
}

/**
 * Input for getTeamStats query
 */
export interface GetTeamStatsInput extends PaginationInput {
  readonly teamId: number;
  readonly seasonId?: number | undefined;
}

/**
 * Input for getLeaderboard query
 */
export interface GetLeaderboardInput extends PaginationInput {
  readonly seasonId?: number | undefined;
  readonly leagueId?: number | undefined;
  readonly statType?: "regular" | "playoff" | "career" | undefined;
  readonly sortBy?: "points" | "goals" | "assists" | undefined;
}

/**
 * Enriched player stat with joined player/team/season info
 */
export interface PlayerStatWithDetails extends PlayerStatSelect {
  readonly playerName: string | null;
  readonly teamName: string;
  readonly seasonYear: number;
  readonly leagueAbbreviation: string;
}

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

export class StatsRepo extends Effect.Service<StatsRepo>()("StatsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    /**
     * Build cursor condition for points-based pagination (descending)
     * For descending order: WHERE (points < cursor.points) OR (points = cursor.points AND id < cursor.id)
     */
    const buildCursorCondition = (cursor: StatsCursor | undefined) => {
      if (!cursor) return;
      return or(
        lt(playerStatTable.points, cursor.points),
        and(
          eq(playerStatTable.points, cursor.points),
          lt(playerStatTable.id, cursor.id),
        ),
      );
    };

    return {
      /**
       * Get all stats for a specific player across all seasons
       */
      getPlayerStats: (input: GetPlayerStatsInput) =>
        Effect.gen(function* () {
          const cursorCondition = buildCursorCondition(input.cursor);

          const stats = yield* db
            .select({
              id: playerStatTable.id,
              sourcePlayerId: playerStatTable.sourcePlayerId,
              seasonId: playerStatTable.seasonId,
              teamId: playerStatTable.teamId,
              gameId: playerStatTable.gameId,
              statType: playerStatTable.statType,
              goals: playerStatTable.goals,
              assists: playerStatTable.assists,
              points: playerStatTable.points,
              shots: playerStatTable.shots,
              shotsOnGoal: playerStatTable.shotsOnGoal,
              groundBalls: playerStatTable.groundBalls,
              turnovers: playerStatTable.turnovers,
              causedTurnovers: playerStatTable.causedTurnovers,
              faceoffWins: playerStatTable.faceoffWins,
              faceoffLosses: playerStatTable.faceoffLosses,
              saves: playerStatTable.saves,
              goalsAgainst: playerStatTable.goalsAgainst,
              gamesPlayed: playerStatTable.gamesPlayed,
              sourceHash: playerStatTable.sourceHash,
              createdAt: playerStatTable.createdAt,
              updatedAt: playerStatTable.updatedAt,
              playerName: sourcePlayerTable.fullName,
              teamName: teamTable.name,
              seasonYear: seasonTable.year,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(
              seasonTable,
              eq(playerStatTable.seasonId, seasonTable.id),
            )
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(
              and(
                eq(playerStatTable.sourcePlayerId, input.sourcePlayerId),
                cursorCondition,
              ),
            )
            .orderBy(desc(playerStatTable.points), desc(playerStatTable.id))
            .limit(input.limit)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch player stats",
                    cause,
                  }),
              ),
            );

          return stats as PlayerStatWithDetails[];
        }),

      /**
       * Get stats for a specific player in a specific season
       */
      getPlayerStatsBySeason: (input: GetPlayerStatsBySeasonInput) =>
        Effect.gen(function* () {
          const cursorCondition = buildCursorCondition(input.cursor);

          const stats = yield* db
            .select({
              id: playerStatTable.id,
              sourcePlayerId: playerStatTable.sourcePlayerId,
              seasonId: playerStatTable.seasonId,
              teamId: playerStatTable.teamId,
              gameId: playerStatTable.gameId,
              statType: playerStatTable.statType,
              goals: playerStatTable.goals,
              assists: playerStatTable.assists,
              points: playerStatTable.points,
              shots: playerStatTable.shots,
              shotsOnGoal: playerStatTable.shotsOnGoal,
              groundBalls: playerStatTable.groundBalls,
              turnovers: playerStatTable.turnovers,
              causedTurnovers: playerStatTable.causedTurnovers,
              faceoffWins: playerStatTable.faceoffWins,
              faceoffLosses: playerStatTable.faceoffLosses,
              saves: playerStatTable.saves,
              goalsAgainst: playerStatTable.goalsAgainst,
              gamesPlayed: playerStatTable.gamesPlayed,
              sourceHash: playerStatTable.sourceHash,
              createdAt: playerStatTable.createdAt,
              updatedAt: playerStatTable.updatedAt,
              playerName: sourcePlayerTable.fullName,
              teamName: teamTable.name,
              seasonYear: seasonTable.year,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(
              seasonTable,
              eq(playerStatTable.seasonId, seasonTable.id),
            )
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(
              and(
                eq(playerStatTable.sourcePlayerId, input.sourcePlayerId),
                eq(playerStatTable.seasonId, input.seasonId),
                cursorCondition,
              ),
            )
            .orderBy(desc(playerStatTable.points), desc(playerStatTable.id))
            .limit(input.limit)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch player stats by season",
                    cause,
                  }),
              ),
            );

          return stats as PlayerStatWithDetails[];
        }),

      /**
       * Get all player stats for a specific team
       */
      getTeamStats: (input: GetTeamStatsInput) =>
        Effect.gen(function* () {
          const cursorCondition = buildCursorCondition(input.cursor);

          const conditions = [
            eq(playerStatTable.teamId, input.teamId),
            cursorCondition,
          ];

          if (input.seasonId !== undefined) {
            conditions.push(eq(playerStatTable.seasonId, input.seasonId));
          }

          const stats = yield* db
            .select({
              id: playerStatTable.id,
              sourcePlayerId: playerStatTable.sourcePlayerId,
              seasonId: playerStatTable.seasonId,
              teamId: playerStatTable.teamId,
              gameId: playerStatTable.gameId,
              statType: playerStatTable.statType,
              goals: playerStatTable.goals,
              assists: playerStatTable.assists,
              points: playerStatTable.points,
              shots: playerStatTable.shots,
              shotsOnGoal: playerStatTable.shotsOnGoal,
              groundBalls: playerStatTable.groundBalls,
              turnovers: playerStatTable.turnovers,
              causedTurnovers: playerStatTable.causedTurnovers,
              faceoffWins: playerStatTable.faceoffWins,
              faceoffLosses: playerStatTable.faceoffLosses,
              saves: playerStatTable.saves,
              goalsAgainst: playerStatTable.goalsAgainst,
              gamesPlayed: playerStatTable.gamesPlayed,
              sourceHash: playerStatTable.sourceHash,
              createdAt: playerStatTable.createdAt,
              updatedAt: playerStatTable.updatedAt,
              playerName: sourcePlayerTable.fullName,
              teamName: teamTable.name,
              seasonYear: seasonTable.year,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(
              seasonTable,
              eq(playerStatTable.seasonId, seasonTable.id),
            )
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(and(...conditions))
            .orderBy(desc(playerStatTable.points), desc(playerStatTable.id))
            .limit(input.limit)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch team stats",
                    cause,
                  }),
              ),
            );

          return stats as PlayerStatWithDetails[];
        }),

      /**
       * Get leaderboard with optional filters
       */
      getLeaderboard: (input: GetLeaderboardInput) =>
        Effect.gen(function* () {
          const sortColumn =
            input.sortBy === "goals"
              ? playerStatTable.goals
              : input.sortBy === "assists"
                ? playerStatTable.assists
                : playerStatTable.points;

          // Build cursor condition based on sort column
          const buildLeaderboardCursor = (cursor: StatsCursor | undefined) => {
            if (!cursor) return;
            // Note: cursor.points holds the value of whatever sortBy column we're using
            return or(
              lt(sortColumn, cursor.points),
              and(
                eq(sortColumn, cursor.points),
                lt(playerStatTable.id, cursor.id),
              ),
            );
          };

          const cursorCondition = buildLeaderboardCursor(input.cursor);

          const conditions: ReturnType<typeof eq>[] = [];

          if (input.seasonId !== undefined) {
            conditions.push(eq(playerStatTable.seasonId, input.seasonId));
          }

          if (input.leagueId !== undefined) {
            conditions.push(eq(sourcePlayerTable.leagueId, input.leagueId));
          }

          if (input.statType !== undefined) {
            conditions.push(eq(playerStatTable.statType, input.statType));
          }

          // Filter out soft-deleted players
          conditions.push(isNull(sourcePlayerTable.deletedAt));

          if (cursorCondition) {
            conditions.push(cursorCondition);
          }

          const stats = yield* db
            .select({
              id: playerStatTable.id,
              sourcePlayerId: playerStatTable.sourcePlayerId,
              seasonId: playerStatTable.seasonId,
              teamId: playerStatTable.teamId,
              gameId: playerStatTable.gameId,
              statType: playerStatTable.statType,
              goals: playerStatTable.goals,
              assists: playerStatTable.assists,
              points: playerStatTable.points,
              shots: playerStatTable.shots,
              shotsOnGoal: playerStatTable.shotsOnGoal,
              groundBalls: playerStatTable.groundBalls,
              turnovers: playerStatTable.turnovers,
              causedTurnovers: playerStatTable.causedTurnovers,
              faceoffWins: playerStatTable.faceoffWins,
              faceoffLosses: playerStatTable.faceoffLosses,
              saves: playerStatTable.saves,
              goalsAgainst: playerStatTable.goalsAgainst,
              gamesPlayed: playerStatTable.gamesPlayed,
              sourceHash: playerStatTable.sourceHash,
              createdAt: playerStatTable.createdAt,
              updatedAt: playerStatTable.updatedAt,
              playerName: sourcePlayerTable.fullName,
              teamName: teamTable.name,
              seasonYear: seasonTable.year,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(
              seasonTable,
              eq(playerStatTable.seasonId, seasonTable.id),
            )
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(sortColumn), desc(playerStatTable.id))
            .limit(input.limit)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch leaderboard",
                    cause,
                  }),
              ),
            );

          return stats as PlayerStatWithDetails[];
        }),

      /**
       * Get a single stat record by ID
       */
      getById: (id: number) =>
        Effect.gen(function* () {
          const result = yield* db
            .select({
              id: playerStatTable.id,
              sourcePlayerId: playerStatTable.sourcePlayerId,
              seasonId: playerStatTable.seasonId,
              teamId: playerStatTable.teamId,
              gameId: playerStatTable.gameId,
              statType: playerStatTable.statType,
              goals: playerStatTable.goals,
              assists: playerStatTable.assists,
              points: playerStatTable.points,
              shots: playerStatTable.shots,
              shotsOnGoal: playerStatTable.shotsOnGoal,
              groundBalls: playerStatTable.groundBalls,
              turnovers: playerStatTable.turnovers,
              causedTurnovers: playerStatTable.causedTurnovers,
              faceoffWins: playerStatTable.faceoffWins,
              faceoffLosses: playerStatTable.faceoffLosses,
              saves: playerStatTable.saves,
              goalsAgainst: playerStatTable.goalsAgainst,
              gamesPlayed: playerStatTable.gamesPlayed,
              sourceHash: playerStatTable.sourceHash,
              createdAt: playerStatTable.createdAt,
              updatedAt: playerStatTable.updatedAt,
              playerName: sourcePlayerTable.fullName,
              teamName: teamTable.name,
              seasonYear: seasonTable.year,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(
              seasonTable,
              eq(playerStatTable.seasonId, seasonTable.id),
            )
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(eq(playerStatTable.id, id))
            .limit(1)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch stat by ID",
                    cause,
                  }),
              ),
            );

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({
                message: `Player stat with ID ${id} not found`,
                resourceType: "PlayerStat",
                resourceId: id,
              }),
            );
          }

          return result[0] as PlayerStatWithDetails;
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
