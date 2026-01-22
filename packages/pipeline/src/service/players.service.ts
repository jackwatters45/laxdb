import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import { and, eq, isNull, sql } from "drizzle-orm";
import { Effect, Schema } from "effect";

import {
  canonicalPlayerTable,
  type CanonicalPlayerInsert,
} from "../db/canonical-players.sql";
import {
  playerIdentityTable,
  type PlayerIdentityInsert,
} from "../db/player-identities.sql";
import { sourcePlayerTable } from "../db/source-players.sql";

import { PlayersRepo, type SourcePlayerWithLeague } from "./players.repo";

/**
 * Service-level error for business logic failures
 */
export class PlayersServiceError extends Schema.TaggedError<PlayersServiceError>(
  "PlayersServiceError",
)("PlayersServiceError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Error when no identity match can be established
 */
export class NoMatchError extends Schema.TaggedError<NoMatchError>(
  "NoMatchError",
)("NoMatchError", {
  message: Schema.String,
  sourcePlayerId: Schema.Number,
}) {}

/**
 * Error when a source player is already linked
 */
export class AlreadyLinkedError extends Schema.TaggedError<AlreadyLinkedError>(
  "AlreadyLinkedError",
)("AlreadyLinkedError", {
  message: Schema.String,
  sourcePlayerId: Schema.Number,
  existingCanonicalPlayerId: Schema.Number,
}) {}

/**
 * Input for getPlayer (by canonical player ID)
 */
export interface GetPlayerInput {
  readonly canonicalPlayerId: number;
}

/**
 * Input for searchPlayers
 */
export interface SearchPlayersInput {
  readonly query: string;
  readonly leagueId?: number | undefined;
  readonly limit: number;
}

/**
 * Input for linkPlayerIdentity
 */
export interface LinkPlayerIdentityInput {
  readonly sourcePlayerId: number;
}

/**
 * Result of linking a player identity
 */
export interface LinkPlayerIdentityResult {
  readonly canonicalPlayerId: number;
  readonly isNewCanonical: boolean;
  readonly linkedSourcePlayerIds: readonly number[];
  readonly matchMethod: "exact";
  readonly confidenceScore: 1.0;
}

/**
 * Potential match candidate for a source player
 */
export interface MatchCandidate {
  readonly sourcePlayer: SourcePlayerWithLeague;
  readonly canonicalPlayerId: number | null;
}

export class PlayersService extends Effect.Service<PlayersService>()(
  "PlayersService",
  {
    effect: Effect.gen(function* () {
      const playersRepo = yield* PlayersRepo;
      const db = yield* PgDrizzle;

      return {
        /**
         * Get a canonical player by ID with all linked source players.
         * Returns all source records for the canonical player.
         */
        getPlayer: (input: GetPlayerInput) =>
          playersRepo
            .getCanonicalPlayer({ canonicalPlayerId: input.canonicalPlayerId })
            .pipe(
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new PlayersServiceError({
                    message: e.message,
                    cause: e,
                  }),
                ),
              ),
              Effect.catchTag("DatabaseError", (e) =>
                Effect.fail(
                  new PlayersServiceError({
                    message: "Failed to fetch player",
                    cause: e,
                  }),
                ),
              ),
            ),

        /**
         * Search for players by name.
         * Uses normalized_name for matching via PlayersRepo.
         */
        searchPlayers: (input: SearchPlayersInput) =>
          playersRepo
            .searchPlayers({
              query: input.query,
              leagueId: input.leagueId,
              limit: input.limit,
            })
            .pipe(
              Effect.catchTag("DatabaseError", (e) =>
                Effect.fail(
                  new PlayersServiceError({
                    message: "Failed to search players",
                    cause: e,
                  }),
                ),
              ),
            ),

        /**
         * Link a source player to a canonical player via exact match.
         * Exact match requires: normalized_name AND DOB both match.
         * MVP: confidence = 1.0 for exact matches only.
         *
         * If no existing canonical player matches, creates a new canonical player.
         * If an existing canonical player matches, links to it.
         *
         * @throws NoMatchError - if source player has no DOB (can't verify exact match)
         * @throws AlreadyLinkedError - if source player is already linked
         */
        linkPlayerIdentity: (input: LinkPlayerIdentityInput) =>
          Effect.gen(function* () {
            // Get the source player
            const sourcePlayer = yield* playersRepo
              .getPlayer({ sourcePlayerId: input.sourcePlayerId })
              .pipe(
                Effect.catchTag("NotFoundError", (e) =>
                  Effect.fail(
                    new PlayersServiceError({
                      message: e.message,
                      cause: e,
                    }),
                  ),
                ),
                Effect.catchTag("DatabaseError", (e) =>
                  Effect.fail(
                    new PlayersServiceError({
                      message: "Failed to fetch source player",
                      cause: e,
                    }),
                  ),
                ),
              );

            // Check if already linked
            const existingLink = yield* db
              .select()
              .from(playerIdentityTable)
              .where(
                eq(playerIdentityTable.sourcePlayerId, input.sourcePlayerId),
              )
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new PlayersServiceError({
                      message: "Failed to check existing identity link",
                      cause,
                    }),
                ),
              );

            if (existingLink.length > 0) {
              const link = existingLink[0];
              if (!link) {
                return yield* Effect.fail(
                  new PlayersServiceError({
                    message: "Unexpected empty link result",
                  }),
                );
              }
              return yield* Effect.fail(
                new AlreadyLinkedError({
                  message: `Source player ${input.sourcePlayerId} is already linked to canonical player ${link.canonicalPlayerId}`,
                  sourcePlayerId: input.sourcePlayerId,
                  existingCanonicalPlayerId: link.canonicalPlayerId,
                }),
              );
            }

            // For exact match, we require both normalized_name AND DOB
            // If DOB is missing, we cannot establish an exact match
            if (!sourcePlayer.dob) {
              return yield* Effect.fail(
                new NoMatchError({
                  message: `Cannot establish exact match for source player ${input.sourcePlayerId}: missing DOB`,
                  sourcePlayerId: input.sourcePlayerId,
                }),
              );
            }

            if (!sourcePlayer.normalizedName) {
              return yield* Effect.fail(
                new NoMatchError({
                  message: `Cannot establish exact match for source player ${input.sourcePlayerId}: missing normalized name`,
                  sourcePlayerId: input.sourcePlayerId,
                }),
              );
            }

            // Find potential matches: same normalized_name AND same DOB
            // from different leagues (cross-league identity)
            const potentialMatches = yield* db
              .select({
                sourcePlayerId: sourcePlayerTable.id,
                normalizedName: sourcePlayerTable.normalizedName,
                dob: sourcePlayerTable.dob,
                canonicalPlayerId: playerIdentityTable.canonicalPlayerId,
              })
              .from(sourcePlayerTable)
              .leftJoin(
                playerIdentityTable,
                eq(sourcePlayerTable.id, playerIdentityTable.sourcePlayerId),
              )
              .where(
                and(
                  eq(
                    sourcePlayerTable.normalizedName,
                    sourcePlayer.normalizedName,
                  ),
                  eq(sourcePlayerTable.dob, sourcePlayer.dob),
                  isNull(sourcePlayerTable.deletedAt),
                  // Exclude the source player itself
                  sql`${sourcePlayerTable.id} != ${input.sourcePlayerId}`,
                ),
              )
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new PlayersServiceError({
                      message: "Failed to find potential identity matches",
                      cause,
                    }),
                ),
              );

            // Check if any of the matches are already linked to a canonical player
            const linkedMatch = potentialMatches.find(
              (m) => m.canonicalPlayerId !== null,
            );

            if (linkedMatch?.canonicalPlayerId) {
              // Link to existing canonical player
              const identityInsert: PlayerIdentityInsert = {
                canonicalPlayerId: linkedMatch.canonicalPlayerId,
                sourcePlayerId: input.sourcePlayerId,
                confidenceScore: 1.0,
                matchMethod: "exact",
              };

              yield* db
                .insert(playerIdentityTable)
                .values(identityInsert)
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new PlayersServiceError({
                        message: "Failed to create identity link",
                        cause,
                      }),
                  ),
                );

              // Get all linked source player IDs
              const allLinks = yield* db
                .select({ sourcePlayerId: playerIdentityTable.sourcePlayerId })
                .from(playerIdentityTable)
                .where(
                  eq(
                    playerIdentityTable.canonicalPlayerId,
                    linkedMatch.canonicalPlayerId,
                  ),
                )
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new PlayersServiceError({
                        message: "Failed to fetch linked source players",
                        cause,
                      }),
                  ),
                );

              return {
                canonicalPlayerId: linkedMatch.canonicalPlayerId,
                isNewCanonical: false,
                linkedSourcePlayerIds: allLinks.map((l) => l.sourcePlayerId),
                matchMethod: "exact" as const,
                confidenceScore: 1.0 as const,
              } satisfies LinkPlayerIdentityResult;
            }

            // No existing canonical player found - create a new one
            // Use this source player as the primary source
            const displayName =
              sourcePlayer.fullName ??
              `${sourcePlayer.firstName ?? ""} ${sourcePlayer.lastName ?? ""}`.trim();

            const canonicalInsert: CanonicalPlayerInsert = {
              primarySourcePlayerId: input.sourcePlayerId,
              displayName,
              position: sourcePlayer.position,
              dob: sourcePlayer.dob,
              hometown: sourcePlayer.hometown,
              college: sourcePlayer.college,
            };

            const [newCanonical] = yield* db
              .insert(canonicalPlayerTable)
              .values(canonicalInsert)
              .returning({ id: canonicalPlayerTable.id })
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new PlayersServiceError({
                      message: "Failed to create canonical player",
                      cause,
                    }),
                ),
              );

            if (!newCanonical) {
              return yield* Effect.fail(
                new PlayersServiceError({
                  message: "Failed to create canonical player: no ID returned",
                }),
              );
            }

            // Link the source player to the new canonical player
            const identityInsert: PlayerIdentityInsert = {
              canonicalPlayerId: newCanonical.id,
              sourcePlayerId: input.sourcePlayerId,
              confidenceScore: 1.0,
              matchMethod: "exact",
            };

            yield* db
              .insert(playerIdentityTable)
              .values(identityInsert)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new PlayersServiceError({
                      message: "Failed to create identity link",
                      cause,
                    }),
                ),
              );

            // Also link any other matching source players (same name + DOB)
            const linkedSourcePlayerIds: number[] = [input.sourcePlayerId];

            for (const match of potentialMatches) {
              // Only link if not already linked (canonicalPlayerId is null)
              if (match.canonicalPlayerId === null) {
                const matchIdentityInsert: PlayerIdentityInsert = {
                  canonicalPlayerId: newCanonical.id,
                  sourcePlayerId: match.sourcePlayerId,
                  confidenceScore: 1.0,
                  matchMethod: "exact",
                };

                yield* db
                  .insert(playerIdentityTable)
                  .values(matchIdentityInsert)
                  .pipe(
                    Effect.mapError(
                      (cause) =>
                        new PlayersServiceError({
                          message: `Failed to link matching source player ${match.sourcePlayerId}`,
                          cause,
                        }),
                    ),
                  );

                linkedSourcePlayerIds.push(match.sourcePlayerId);
              }
            }

            return {
              canonicalPlayerId: newCanonical.id,
              isNewCanonical: true,
              linkedSourcePlayerIds,
              matchMethod: "exact" as const,
              confidenceScore: 1.0 as const,
            } satisfies LinkPlayerIdentityResult;
          }),
      } as const;
    }),
    dependencies: [PlayersRepo.Default, DatabaseLive],
  },
) {}
