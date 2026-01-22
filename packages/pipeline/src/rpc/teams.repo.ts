import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import type {
  GetTeamInput,
  GetTeamsInput,
  TeamDetails,
  TeamWithRoster,
} from "@laxdb/core/pipeline/teams.schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { Array, Effect, Option } from "effect";

import { leagueTable } from "../db/leagues.sql";
import { seasonTable } from "../db/seasons.sql";
import { sourcePlayerTable } from "../db/source-players.sql";
import { teamTable } from "../db/teams.sql";
import { teamSeasonTable } from "../db/team-seasons.sql";

export class TeamsRepo extends Effect.Service<TeamsRepo>()("TeamsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      getTeam: (input: GetTeamInput) =>
        Effect.gen(function* () {
          // Get the team with league info
          const teamResults = yield* db
            .select({
              id: teamTable.id,
              name: teamTable.name,
              abbreviation: teamTable.abbreviation,
              city: teamTable.city,
              leagueId: teamTable.leagueId,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(teamTable)
            .innerJoin(leagueTable, eq(teamTable.leagueId, leagueTable.id))
            .where(eq(teamTable.id, input.teamId))
            .limit(1);

          const teamOption = Array.head(teamResults);
          if (Option.isNone(teamOption)) {
            return null;
          }
          const team = teamOption.value;

          // Get roster (players linked to this team via team_season)
          // If seasonId provided, filter by that season
          const rosterConditions = [
            eq(teamSeasonTable.teamId, input.teamId),
            isNull(sourcePlayerTable.deletedAt),
          ];

          if (input.seasonId !== undefined) {
            rosterConditions.push(eq(teamSeasonTable.seasonId, input.seasonId));
          }

          const rosterResults = yield* db
            .selectDistinct({
              playerId: sourcePlayerTable.id,
              playerName: sourcePlayerTable.fullName,
              position: sourcePlayerTable.position,
              jerseyNumber: sourcePlayerTable.jerseyNumber,
            })
            .from(teamSeasonTable)
            .innerJoin(
              sourcePlayerTable,
              eq(sourcePlayerTable.leagueId, teamTable.leagueId),
            )
            .innerJoin(teamTable, eq(teamSeasonTable.teamId, teamTable.id))
            .where(and(...rosterConditions))
            .limit(100);

          const result: TeamWithRoster = {
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            city: team.city,
            leagueId: team.leagueId,
            leagueAbbreviation: team.leagueAbbreviation,
            roster: rosterResults.map((r) => ({
              playerId: r.playerId,
              playerName: r.playerName ?? "Unknown",
              position: r.position,
              jerseyNumber: r.jerseyNumber,
            })),
          };

          return result;
        }),

      getTeams: (input: GetTeamsInput) =>
        Effect.gen(function* () {
          const conditions = [];

          // Filter by leagues if provided
          if (input.leagues !== undefined && input.leagues.length > 0) {
            conditions.push(inArray(leagueTable.abbreviation, input.leagues));
          }

          // Filter by season year if provided
          if (input.seasonYear !== undefined) {
            const teamsInSeason = db
              .select({ teamId: teamSeasonTable.teamId })
              .from(teamSeasonTable)
              .innerJoin(
                seasonTable,
                eq(teamSeasonTable.seasonId, seasonTable.id),
              )
              .where(eq(seasonTable.year, input.seasonYear));

            conditions.push(inArray(teamTable.id, teamsInSeason));
          }

          const query = db
            .select({
              id: teamTable.id,
              name: teamTable.name,
              abbreviation: teamTable.abbreviation,
              city: teamTable.city,
              leagueId: teamTable.leagueId,
              leagueAbbreviation: leagueTable.abbreviation,
            })
            .from(teamTable)
            .innerJoin(leagueTable, eq(teamTable.leagueId, leagueTable.id));

          const results =
            conditions.length > 0
              ? yield* query.where(and(...conditions)).limit(input.limit)
              : yield* query.limit(input.limit);

          return results as TeamDetails[];
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
