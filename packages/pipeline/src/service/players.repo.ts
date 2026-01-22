import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { Effect, Schema } from "effect";

import {
  canonicalPlayerTable,
  type CanonicalPlayerSelect,
} from "../db/canonical-players.sql";
import { leagueTable } from "../db/leagues.sql";
import {
  playerIdentityTable,
  type PlayerIdentitySelect,
} from "../db/player-identities.sql";
import {
  sourcePlayerTable,
  type SourcePlayerSelect,
} from "../db/source-players.sql";

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
 * Input for getPlayer query (by source player ID)
 */
export interface GetPlayerInput {
  readonly sourcePlayerId: number;
}

/**
 * Input for getPlayerBySourceId query (by external source ID)
 */
export interface GetPlayerBySourceIdInput {
  readonly leagueId: number;
  readonly sourceId: string;
}

/**
 * Input for searchPlayers query
 */
export interface SearchPlayersInput {
  readonly query: string;
  readonly leagueId?: number | undefined;
  readonly limit: number;
}

/**
 * Input for getCanonicalPlayer query
 */
export interface GetCanonicalPlayerInput {
  readonly canonicalPlayerId: number;
}

/**
 * Source player with league info
 */
export interface SourcePlayerWithLeague extends SourcePlayerSelect {
  readonly leagueName: string;
  readonly leagueAbbreviation: string;
  readonly leaguePriority: number;
}

/**
 * Canonical player with all linked source players
 */
export interface CanonicalPlayerWithSources extends CanonicalPlayerSelect {
  readonly sourcePlayers: SourcePlayerWithLeague[];
}

/**
 * Identity link with source player details
 */
export interface PlayerIdentityWithSource extends PlayerIdentitySelect {
  readonly sourcePlayer: SourcePlayerWithLeague;
}

export class PlayersRepo extends Effect.Service<PlayersRepo>()("PlayersRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      /**
       * Get a source player by their internal ID
       */
      getPlayer: (input: GetPlayerInput) =>
        Effect.gen(function* () {
          const result = yield* db
            .select({
              id: sourcePlayerTable.id,
              leagueId: sourcePlayerTable.leagueId,
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
              sourceHash: sourcePlayerTable.sourceHash,
              createdAt: sourcePlayerTable.createdAt,
              updatedAt: sourcePlayerTable.updatedAt,
              deletedAt: sourcePlayerTable.deletedAt,
              leagueName: leagueTable.name,
              leagueAbbreviation: leagueTable.abbreviation,
              leaguePriority: leagueTable.priority,
            })
            .from(sourcePlayerTable)
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(
              and(
                eq(sourcePlayerTable.id, input.sourcePlayerId),
                isNull(sourcePlayerTable.deletedAt),
              ),
            )
            .limit(1)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch player",
                    cause,
                  }),
              ),
            );

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({
                message: `Source player with ID ${input.sourcePlayerId} not found`,
                resourceType: "SourcePlayer",
                resourceId: input.sourcePlayerId,
              }),
            );
          }

          return result[0] as SourcePlayerWithLeague;
        }),

      /**
       * Get a source player by their external source ID within a league
       */
      getPlayerBySourceId: (input: GetPlayerBySourceIdInput) =>
        Effect.gen(function* () {
          const result = yield* db
            .select({
              id: sourcePlayerTable.id,
              leagueId: sourcePlayerTable.leagueId,
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
              sourceHash: sourcePlayerTable.sourceHash,
              createdAt: sourcePlayerTable.createdAt,
              updatedAt: sourcePlayerTable.updatedAt,
              deletedAt: sourcePlayerTable.deletedAt,
              leagueName: leagueTable.name,
              leagueAbbreviation: leagueTable.abbreviation,
              leaguePriority: leagueTable.priority,
            })
            .from(sourcePlayerTable)
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(
              and(
                eq(sourcePlayerTable.leagueId, input.leagueId),
                eq(sourcePlayerTable.sourceId, input.sourceId),
                isNull(sourcePlayerTable.deletedAt),
              ),
            )
            .limit(1)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch player by source ID",
                    cause,
                  }),
              ),
            );

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({
                message: `Source player with sourceId ${input.sourceId} in league ${input.leagueId} not found`,
                resourceType: "SourcePlayer",
                resourceId: input.sourceId,
              }),
            );
          }

          return result[0] as SourcePlayerWithLeague;
        }),

      /**
       * Search for players by name using normalized_name for matching
       * Supports optional league filter
       */
      searchPlayers: (input: SearchPlayersInput) =>
        Effect.gen(function* () {
          // Normalize query for matching: lowercase, trim whitespace
          const normalizedQuery = input.query.toLowerCase().trim();

          // Build conditions
          const conditions = [
            // Match on normalized_name (case-insensitive via ilike)
            or(
              ilike(sourcePlayerTable.normalizedName, `%${normalizedQuery}%`),
              ilike(sourcePlayerTable.fullName, `%${input.query}%`),
            ),
            // Exclude soft-deleted players
            isNull(sourcePlayerTable.deletedAt),
          ];

          // Add league filter if specified
          if (input.leagueId !== undefined) {
            conditions.push(eq(sourcePlayerTable.leagueId, input.leagueId));
          }

          const results = yield* db
            .select({
              id: sourcePlayerTable.id,
              leagueId: sourcePlayerTable.leagueId,
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
              sourceHash: sourcePlayerTable.sourceHash,
              createdAt: sourcePlayerTable.createdAt,
              updatedAt: sourcePlayerTable.updatedAt,
              deletedAt: sourcePlayerTable.deletedAt,
              leagueName: leagueTable.name,
              leagueAbbreviation: leagueTable.abbreviation,
              leaguePriority: leagueTable.priority,
            })
            .from(sourcePlayerTable)
            .innerJoin(
              leagueTable,
              eq(sourcePlayerTable.leagueId, leagueTable.id),
            )
            .where(and(...conditions))
            .limit(input.limit)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to search players",
                    cause,
                  }),
              ),
            );

          return results as SourcePlayerWithLeague[];
        }),

      /**
       * Get a canonical player by ID with all linked source players
       */
      getCanonicalPlayer: (input: GetCanonicalPlayerInput) =>
        Effect.gen(function* () {
          // First, get the canonical player record
          const canonicalResult = yield* db
            .select()
            .from(canonicalPlayerTable)
            .where(eq(canonicalPlayerTable.id, input.canonicalPlayerId))
            .limit(1)
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch canonical player",
                    cause,
                  }),
              ),
            );

          if (canonicalResult.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({
                message: `Canonical player with ID ${input.canonicalPlayerId} not found`,
                resourceType: "CanonicalPlayer",
                resourceId: input.canonicalPlayerId,
              }),
            );
          }

          const canonicalPlayer = canonicalResult[0];

          // Then, get all linked source players via player_identities
          const linkedPlayers = yield* db
            .select({
              id: sourcePlayerTable.id,
              leagueId: sourcePlayerTable.leagueId,
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
              sourceHash: sourcePlayerTable.sourceHash,
              createdAt: sourcePlayerTable.createdAt,
              updatedAt: sourcePlayerTable.updatedAt,
              deletedAt: sourcePlayerTable.deletedAt,
              leagueName: leagueTable.name,
              leagueAbbreviation: leagueTable.abbreviation,
              leaguePriority: leagueTable.priority,
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
                eq(
                  playerIdentityTable.canonicalPlayerId,
                  input.canonicalPlayerId,
                ),
                isNull(sourcePlayerTable.deletedAt),
              ),
            )
            .pipe(
              Effect.mapError(
                (cause) =>
                  new DatabaseError({
                    message: "Failed to fetch linked source players",
                    cause,
                  }),
              ),
            );

          return {
            ...canonicalPlayer,
            sourcePlayers: linkedPlayers as SourcePlayerWithLeague[],
          } as CanonicalPlayerWithSources;
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
