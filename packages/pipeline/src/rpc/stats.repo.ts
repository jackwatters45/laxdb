import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import type {
  GetLeaderboardInput,
  GetPlayerStatsInput,
  GetTeamStatsInput,
  LeaderboardEntry,
  TeamStatSummary,
} from "@laxdb/core/pipeline/stats.schema";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { Effect } from "effect";

import { leagueTable } from "../db/leagues.sql";
import { playerStatTable } from "../db/player-stats.sql";
import { seasonTable } from "../db/seasons.sql";
import { sourcePlayerTable } from "../db/source-players.sql";
import { teamTable } from "../db/teams.sql";

export class StatsRepo extends Effect.Service<StatsRepo>()("StatsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      getPlayerStats: (input: GetPlayerStatsInput) =>
        Effect.gen(function* () {
          const conditions = [
            eq(playerStatTable.sourcePlayerId, input.playerId),
          ];

          if (input.seasonId !== undefined) {
            conditions.push(eq(playerStatTable.seasonId, input.seasonId));
          }

          const results = yield* db
            .select({
              statId: playerStatTable.id,
              goals: sql<number>`COALESCE(${playerStatTable.goals}, 0)`,
              assists: sql<number>`COALESCE(${playerStatTable.assists}, 0)`,
              points: sql<number>`COALESCE(${playerStatTable.points}, 0)`,
              gamesPlayed: sql<number>`COALESCE(${playerStatTable.gamesPlayed}, 0)`,
              playerId: sourcePlayerTable.id,
              playerName: sql<string>`COALESCE(${sourcePlayerTable.fullName}, CONCAT(${sourcePlayerTable.firstName}, ' ', ${sourcePlayerTable.lastName}))`,
              position: sourcePlayerTable.position,
              teamId: teamTable.id,
              teamName: teamTable.name,
              teamAbbreviation: teamTable.abbreviation,
              leagueId: leagueTable.id,
              leagueAbbreviation: leagueTable.abbreviation,
              seasonId: seasonTable.id,
              seasonYear: seasonTable.year,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .innerJoin(
              seasonTable,
              eq(playerStatTable.seasonId, seasonTable.id),
            )
            .where(and(...conditions))
            .orderBy(desc(seasonTable.year));

          return results;
        }),

      getLeaderboard: (input: GetLeaderboardInput) =>
        Effect.gen(function* () {
          const sortColumn =
            input.sort === "goals"
              ? playerStatTable.goals
              : input.sort === "assists"
                ? playerStatTable.assists
                : playerStatTable.points;

          const conditions = [inArray(leagueTable.abbreviation, input.leagues)];

          // Cursor is the stat ID to start after
          if (input.cursor !== undefined) {
            const cursorId = Number.parseInt(input.cursor, 10);
            if (!Number.isNaN(cursorId)) {
              conditions.push(gt(playerStatTable.id, cursorId));
            }
          }

          const results = yield* db
            .select({
              statId: playerStatTable.id,
              playerId: sourcePlayerTable.id,
              playerName: sql<string>`COALESCE(${sourcePlayerTable.fullName}, CONCAT(${sourcePlayerTable.firstName}, ' ', ${sourcePlayerTable.lastName}))`,
              position: sourcePlayerTable.position,
              teamName: teamTable.name,
              teamAbbreviation: teamTable.abbreviation,
              leagueAbbreviation: leagueTable.abbreviation,
              goals: playerStatTable.goals,
              assists: playerStatTable.assists,
              points: playerStatTable.points,
              gamesPlayed: playerStatTable.gamesPlayed,
            })
            .from(playerStatTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerStatTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(and(...conditions))
            .orderBy(desc(sortColumn), playerStatTable.id)
            .limit(input.limit + 1); // Fetch one extra to determine if there's a next page

          const hasMore = results.length > input.limit;
          const data = hasMore ? results.slice(0, input.limit) : results;

          // Add rank to each entry
          const rankedData: LeaderboardEntry[] = data.map((row, index) => ({
            statId: row.statId,
            rank: index + 1,
            playerId: row.playerId,
            playerName: row.playerName,
            position: row.position,
            teamName: row.teamName,
            teamAbbreviation: row.teamAbbreviation,
            leagueAbbreviation: row.leagueAbbreviation,
            goals: row.goals ?? 0,
            assists: row.assists ?? 0,
            points: row.points ?? 0,
            gamesPlayed: row.gamesPlayed ?? 0,
          }));

          const lastItem = data.at(-1);
          const nextCursor =
            hasMore && lastItem ? String(lastItem.statId) : null;

          return { data: rankedData, nextCursor };
        }),

      getTeamStats: (input: GetTeamStatsInput) =>
        Effect.gen(function* () {
          const conditions = [eq(playerStatTable.teamId, input.teamId)];

          if (input.seasonId !== undefined) {
            conditions.push(eq(playerStatTable.seasonId, input.seasonId));
          }

          const results = yield* db
            .select({
              teamId: teamTable.id,
              teamName: teamTable.name,
              teamAbbreviation: teamTable.abbreviation,
              leagueAbbreviation: leagueTable.abbreviation,
              seasonYear: seasonTable.year,
              totalGoals: sql<number>`SUM(COALESCE(${playerStatTable.goals}, 0))::int`,
              totalAssists: sql<number>`SUM(COALESCE(${playerStatTable.assists}, 0))::int`,
              totalPoints: sql<number>`SUM(COALESCE(${playerStatTable.points}, 0))::int`,
              playerCount: sql<number>`COUNT(DISTINCT ${playerStatTable.sourcePlayerId})::int`,
            })
            .from(playerStatTable)
            .innerJoin(teamTable, eq(playerStatTable.teamId, teamTable.id))
            .innerJoin(leagueTable, eq(teamTable.leagueId, leagueTable.id))
            .innerJoin(
              seasonTable,
              eq(playerStatTable.seasonId, seasonTable.id),
            )
            .where(and(...conditions))
            .groupBy(
              teamTable.id,
              teamTable.name,
              teamTable.abbreviation,
              leagueTable.abbreviation,
              seasonTable.year,
            )
            .orderBy(desc(seasonTable.year));

          return results as TeamStatSummary[];
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
