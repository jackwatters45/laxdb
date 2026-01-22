import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import type {
  CanonicalPlayer,
  GetPlayerInput,
  PlayerSearchResult,
  SearchPlayersInput,
  SourcePlayer,
} from "@laxdb/core/pipeline/players.schema";
import { and, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { Array, Effect, Option } from "effect";

import { canonicalPlayerTable } from "../db/canonical-players.sql";
import { leagueTable } from "../db/leagues.sql";
import { playerIdentityTable } from "../db/player-identities.sql";
import { sourcePlayerTable } from "../db/source-players.sql";
import { teamSeasonTable } from "../db/team-seasons.sql";
import { teamTable } from "../db/teams.sql";

export class PlayersRepo extends Effect.Service<PlayersRepo>()("PlayersRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      getPlayer: (input: GetPlayerInput) =>
        Effect.gen(function* () {
          // Get the canonical player
          const canonicalResults = yield* db
            .select({
              id: canonicalPlayerTable.id,
              displayName: canonicalPlayerTable.displayName,
              position: canonicalPlayerTable.position,
              dob: canonicalPlayerTable.dob,
              hometown: canonicalPlayerTable.hometown,
              college: canonicalPlayerTable.college,
            })
            .from(canonicalPlayerTable)
            .where(eq(canonicalPlayerTable.id, input.playerId))
            .limit(1);

          const rowOption = Array.head(canonicalResults);
          if (Option.isNone(rowOption)) {
            return null;
          }
          const row = rowOption.value;

          // Get all linked source records
          const sourceResults = yield* db
            .select({
              id: sourcePlayerTable.id,
              leagueId: sourcePlayerTable.leagueId,
              leagueAbbreviation: leagueTable.abbreviation,
              sourceId: sourcePlayerTable.sourceId,
              firstName: sourcePlayerTable.firstName,
              lastName: sourcePlayerTable.lastName,
              fullName: sourcePlayerTable.fullName,
              normalizedName: sourcePlayerTable.normalizedName,
              position: sourcePlayerTable.position,
              jerseyNumber: sourcePlayerTable.jerseyNumber,
              dob: sourcePlayerTable.dob,
              hometown: sourcePlayerTable.hometown,
              college: sourcePlayerTable.college,
              handedness: sourcePlayerTable.handedness,
              heightInches: sourcePlayerTable.heightInches,
              weightLbs: sourcePlayerTable.weightLbs,
            })
            .from(playerIdentityTable)
            .innerJoin(
              sourcePlayerTable,
              eq(playerIdentityTable.sourcePlayerId, sourcePlayerTable.id),
            )
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(
              and(
                eq(playerIdentityTable.canonicalPlayerId, input.playerId),
                isNull(sourcePlayerTable.deletedAt),
              ),
            );

          const result: CanonicalPlayer = {
            id: row.id,
            displayName: row.displayName,
            position: row.position,
            dob: row.dob,
            hometown: row.hometown,
            college: row.college,
            sourceRecords: sourceResults as SourcePlayer[],
          };

          return result;
        }),

      searchPlayers: (input: SearchPlayersInput) =>
        Effect.gen(function* () {
          // Normalize query for ILIKE search
          const searchPattern = `%${input.query.toLowerCase()}%`;

          const conditions = [
            ilike(sourcePlayerTable.normalizedName, searchPattern),
            isNull(sourcePlayerTable.deletedAt),
          ];

          if (input.leagues !== undefined && input.leagues.length > 0) {
            conditions.push(inArray(leagueTable.abbreviation, input.leagues));
          }

          // Search source players by normalized name
          const results = yield* db
            .select({
              playerId: sourcePlayerTable.id,
              playerName: sql<string>`COALESCE(${sourcePlayerTable.fullName}, CONCAT(${sourcePlayerTable.firstName}, ' ', ${sourcePlayerTable.lastName}))`,
              position: sourcePlayerTable.position,
              leagueAbbreviation: leagueTable.abbreviation,
              teamName: teamTable.name,
            })
            .from(sourcePlayerTable)
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .leftJoin(
              teamSeasonTable,
              eq(sourcePlayerTable.id, teamSeasonTable.teamId),
            )
            .leftJoin(teamTable, eq(teamSeasonTable.teamId, teamTable.id))
            .where(and(...conditions))
            .limit(input.limit);

          return results as PlayerSearchResult[];
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
