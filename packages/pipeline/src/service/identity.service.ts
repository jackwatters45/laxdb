import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { DatabaseLive } from "@laxdb/core/drizzle/drizzle.service";
import { and, eq, isNull, sql } from "drizzle-orm";
import { Effect, Schema } from "effect";

import {
  canonicalPlayerTable,
  type CanonicalPlayerInsert,
} from "../db/canonical-players.sql";
import { leagueTable } from "../db/leagues.sql";
import {
  playerIdentityTable,
  type PlayerIdentityInsert,
} from "../db/player-identities.sql";
import { sourcePlayerTable } from "../db/source-players.sql";

/**
 * Service-level error for identity operations
 */
export class IdentityServiceError extends Schema.TaggedError<IdentityServiceError>(
  "IdentityServiceError",
)("IdentityServiceError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Error when source player is not found
 */
export class SourcePlayerNotFoundError extends Schema.TaggedError<SourcePlayerNotFoundError>(
  "SourcePlayerNotFoundError",
)("SourcePlayerNotFoundError", {
  message: Schema.String,
  sourcePlayerId: Schema.Number,
}) {}

/**
 * Error when source player is already linked
 */
export class AlreadyLinkedError extends Schema.TaggedError<AlreadyLinkedError>(
  "AlreadyLinkedError",
)("AlreadyLinkedError", {
  message: Schema.String,
  sourcePlayerId: Schema.Number,
  existingCanonicalPlayerId: Schema.Number,
}) {}

/**
 * Error when no exact match can be established (missing required data)
 */
export class NoExactMatchDataError extends Schema.TaggedError<NoExactMatchDataError>(
  "NoExactMatchDataError",
)("NoExactMatchDataError", {
  message: Schema.String,
  sourcePlayerId: Schema.Number,
  missingField: Schema.String,
}) {}

/**
 * Potential match candidate for identity resolution
 */
export interface MatchCandidate {
  readonly sourcePlayerId: number;
  readonly normalizedName: string | null;
  readonly dob: Date | null;
  readonly canonicalPlayerId: number | null;
  readonly leagueId: number;
  readonly leaguePriority: number;
}

/**
 * Input for findExactMatches
 */
export interface FindExactMatchesInput {
  readonly normalizedName: string;
  readonly dob: Date;
  readonly excludeSourcePlayerId?: number;
}

/**
 * Input for createCanonicalPlayer
 */
export interface CreateCanonicalPlayerInput {
  readonly primarySourcePlayerId: number;
  readonly displayName: string;
  readonly position?: string | null;
  readonly dob?: Date | null;
  readonly hometown?: string | null;
  readonly college?: string | null;
}

/**
 * Input for linkSourcePlayer
 */
export interface LinkSourcePlayerInput {
  readonly canonicalPlayerId: number;
  readonly sourcePlayerId: number;
  readonly matchMethod?: "exact" | "fuzzy" | "manual";
  readonly confidenceScore?: number;
}

/**
 * Result of creating a canonical player
 */
export interface CreateCanonicalPlayerResult {
  readonly canonicalPlayerId: number;
}

/**
 * Result of linking a source player
 */
export interface LinkSourcePlayerResult {
  readonly identityId: number;
  readonly canonicalPlayerId: number;
  readonly sourcePlayerId: number;
}

/**
 * Character replacements for special characters that NFD decomposition doesn't handle.
 * These are characters that don't decompose into base + combining mark.
 */
const SPECIAL_CHAR_MAP: Record<string, string> = {
  // Nordic
  ø: "o",
  Ø: "o",
  æ: "ae",
  Æ: "ae",
  å: "a",
  Å: "a",
  // German
  ß: "ss",
  // Polish
  ł: "l",
  Ł: "l",
  // Icelandic
  ð: "d",
  Ð: "d",
  þ: "th",
  Þ: "th",
};

/**
 * Normalizes a name for identity matching.
 * - Converts to lowercase
 * - Removes accents/diacritics
 * - Replaces special characters (ø, æ, ß, ł, etc.)
 * - Removes non-alphanumeric characters except spaces
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 */
export function normalizeName(name: string): string {
  let result = name.toLowerCase();

  // Replace special characters that don't decompose via NFD
  for (const [char, replacement] of Object.entries(SPECIAL_CHAR_MAP)) {
    result = result.replaceAll(new RegExp(char, "g"), replacement);
  }

  return (
    result
      // Normalize Unicode to decomposed form (separate base chars from accents)
      .normalize("NFD")
      // Remove combining diacritical marks (accents)
      .replaceAll(/[\u0300-\u036F]/g, "")
      // Remove non-alphanumeric except spaces
      .replaceAll(/[^a-z0-9\s]/g, "")
      // Collapse multiple spaces
      .replaceAll(/\s+/g, " ")
      // Trim
      .trim()
  );
}

export class IdentityService extends Effect.Service<IdentityService>()(
  "IdentityService",
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      return {
        /**
         * Normalize a name for identity matching.
         * Pure function exposed as a service method for consistency.
         */
        normalizeName: (name: string): string => normalizeName(name),

        /**
         * Find source players with exact match on normalized_name AND dob.
         * Returns match candidates with their canonical player link status.
         * Ordered by league priority (lower = more reliable).
         */
        findExactMatches: (input: FindExactMatchesInput) =>
          Effect.gen(function* () {
            const conditions = [
              eq(sourcePlayerTable.normalizedName, input.normalizedName),
              eq(sourcePlayerTable.dob, input.dob),
              isNull(sourcePlayerTable.deletedAt),
            ];

            if (input.excludeSourcePlayerId !== undefined) {
              conditions.push(
                sql`${sourcePlayerTable.id} != ${input.excludeSourcePlayerId}`,
              );
            }

            const results = yield* db
              .select({
                sourcePlayerId: sourcePlayerTable.id,
                normalizedName: sourcePlayerTable.normalizedName,
                dob: sourcePlayerTable.dob,
                canonicalPlayerId: playerIdentityTable.canonicalPlayerId,
                leagueId: sourcePlayerTable.leagueId,
                leaguePriority: leagueTable.priority,
              })
              .from(sourcePlayerTable)
              .innerJoin(
                leagueTable,
                eq(sourcePlayerTable.leagueId, leagueTable.id),
              )
              .leftJoin(
                playerIdentityTable,
                eq(sourcePlayerTable.id, playerIdentityTable.sourcePlayerId),
              )
              .where(and(...conditions))
              .orderBy(leagueTable.priority)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new IdentityServiceError({
                      message: "Failed to find exact matches",
                      cause,
                    }),
                ),
              );

            return results as MatchCandidate[];
          }),

        /**
         * Create a new canonical player.
         * The canonical player is the "golden record" for a player identity.
         */
        createCanonicalPlayer: (input: CreateCanonicalPlayerInput) =>
          Effect.gen(function* () {
            const canonicalInsert: CanonicalPlayerInsert = {
              primarySourcePlayerId: input.primarySourcePlayerId,
              displayName: input.displayName,
              position: input.position ?? null,
              dob: input.dob ?? null,
              hometown: input.hometown ?? null,
              college: input.college ?? null,
            };

            const [result] = yield* db
              .insert(canonicalPlayerTable)
              .values(canonicalInsert)
              .returning({ id: canonicalPlayerTable.id })
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new IdentityServiceError({
                      message: "Failed to create canonical player",
                      cause,
                    }),
                ),
              );

            if (!result) {
              return yield* Effect.fail(
                new IdentityServiceError({
                  message: "Failed to create canonical player: no ID returned",
                }),
              );
            }

            return {
              canonicalPlayerId: result.id,
            } satisfies CreateCanonicalPlayerResult;
          }),

        /**
         * Link a source player to a canonical player.
         * Creates a player_identity record.
         *
         * @throws AlreadyLinkedError if source player is already linked
         */
        linkSourcePlayer: (input: LinkSourcePlayerInput) =>
          Effect.gen(function* () {
            // Check if source player is already linked
            const existingLink = yield* db
              .select({
                id: playerIdentityTable.id,
                canonicalPlayerId: playerIdentityTable.canonicalPlayerId,
              })
              .from(playerIdentityTable)
              .where(
                eq(playerIdentityTable.sourcePlayerId, input.sourcePlayerId),
              )
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new IdentityServiceError({
                      message: "Failed to check existing identity link",
                      cause,
                    }),
                ),
              );

            if (existingLink.length > 0) {
              const link = existingLink[0];
              if (link) {
                return yield* Effect.fail(
                  new AlreadyLinkedError({
                    message: `Source player ${input.sourcePlayerId} is already linked to canonical player ${link.canonicalPlayerId}`,
                    sourcePlayerId: input.sourcePlayerId,
                    existingCanonicalPlayerId: link.canonicalPlayerId,
                  }),
                );
              }
            }

            const identityInsert: PlayerIdentityInsert = {
              canonicalPlayerId: input.canonicalPlayerId,
              sourcePlayerId: input.sourcePlayerId,
              confidenceScore: input.confidenceScore ?? 1.0,
              matchMethod: input.matchMethod ?? "exact",
            };

            const [result] = yield* db
              .insert(playerIdentityTable)
              .values(identityInsert)
              .returning({
                id: playerIdentityTable.id,
                canonicalPlayerId: playerIdentityTable.canonicalPlayerId,
                sourcePlayerId: playerIdentityTable.sourcePlayerId,
              })
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new IdentityServiceError({
                      message: "Failed to link source player",
                      cause,
                    }),
                ),
              );

            if (!result) {
              return yield* Effect.fail(
                new IdentityServiceError({
                  message: "Failed to link source player: no result returned",
                }),
              );
            }

            return {
              identityId: result.id,
              canonicalPlayerId: result.canonicalPlayerId,
              sourcePlayerId: result.sourcePlayerId,
            } satisfies LinkSourcePlayerResult;
          }),

        /**
         * Process a source player for identity linking.
         * This is the main entry point for identity resolution.
         *
         * 1. Get the source player data
         * 2. Check if already linked (throw AlreadyLinkedError)
         * 3. Find exact matches (same normalized_name + dob)
         * 4. If match has canonical player, link to it
         * 5. If no canonical exists, create one and link all matches
         *
         * @throws SourcePlayerNotFoundError if source player doesn't exist
         * @throws AlreadyLinkedError if already linked
         * @throws NoExactMatchDataError if missing required data for exact match
         */
        processIdentity: (sourcePlayerId: number) =>
          Effect.gen(function* () {
            // Get the source player
            const sourceResults = yield* db
              .select({
                id: sourcePlayerTable.id,
                normalizedName: sourcePlayerTable.normalizedName,
                dob: sourcePlayerTable.dob,
                firstName: sourcePlayerTable.firstName,
                lastName: sourcePlayerTable.lastName,
                fullName: sourcePlayerTable.fullName,
                position: sourcePlayerTable.position,
                hometown: sourcePlayerTable.hometown,
                college: sourcePlayerTable.college,
                leaguePriority: leagueTable.priority,
              })
              .from(sourcePlayerTable)
              .innerJoin(
                leagueTable,
                eq(sourcePlayerTable.leagueId, leagueTable.id),
              )
              .where(
                and(
                  eq(sourcePlayerTable.id, sourcePlayerId),
                  isNull(sourcePlayerTable.deletedAt),
                ),
              )
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new IdentityServiceError({
                      message: "Failed to fetch source player",
                      cause,
                    }),
                ),
              );

            const sourcePlayer = sourceResults[0];
            if (!sourcePlayer) {
              return yield* Effect.fail(
                new SourcePlayerNotFoundError({
                  message: `Source player ${sourcePlayerId} not found`,
                  sourcePlayerId,
                }),
              );
            }

            // Check if already linked
            const existingLink = yield* db
              .select({
                canonicalPlayerId: playerIdentityTable.canonicalPlayerId,
              })
              .from(playerIdentityTable)
              .where(eq(playerIdentityTable.sourcePlayerId, sourcePlayerId))
              .limit(1)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new IdentityServiceError({
                      message: "Failed to check existing link",
                      cause,
                    }),
                ),
              );

            if (existingLink.length > 0 && existingLink[0]) {
              return yield* Effect.fail(
                new AlreadyLinkedError({
                  message: `Source player ${sourcePlayerId} is already linked to canonical player ${existingLink[0].canonicalPlayerId}`,
                  sourcePlayerId,
                  existingCanonicalPlayerId: existingLink[0].canonicalPlayerId,
                }),
              );
            }

            // Validate required data for exact match
            if (!sourcePlayer.normalizedName) {
              return yield* Effect.fail(
                new NoExactMatchDataError({
                  message: `Cannot establish exact match for source player ${sourcePlayerId}: missing normalized name`,
                  sourcePlayerId,
                  missingField: "normalizedName",
                }),
              );
            }

            if (!sourcePlayer.dob) {
              return yield* Effect.fail(
                new NoExactMatchDataError({
                  message: `Cannot establish exact match for source player ${sourcePlayerId}: missing DOB`,
                  sourcePlayerId,
                  missingField: "dob",
                }),
              );
            }

            // Find exact matches
            const matches = yield* db
              .select({
                sourcePlayerId: sourcePlayerTable.id,
                normalizedName: sourcePlayerTable.normalizedName,
                dob: sourcePlayerTable.dob,
                canonicalPlayerId: playerIdentityTable.canonicalPlayerId,
                leagueId: sourcePlayerTable.leagueId,
                leaguePriority: leagueTable.priority,
              })
              .from(sourcePlayerTable)
              .innerJoin(
                leagueTable,
                eq(sourcePlayerTable.leagueId, leagueTable.id),
              )
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
                  sql`${sourcePlayerTable.id} != ${sourcePlayerId}`,
                ),
              )
              .orderBy(leagueTable.priority)
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new IdentityServiceError({
                      message: "Failed to find matches",
                      cause,
                    }),
                ),
              );

            // Check if any match is already linked to a canonical player
            const linkedMatch = matches.find(
              (m) => m.canonicalPlayerId !== null,
            );

            if (linkedMatch?.canonicalPlayerId) {
              // Link to existing canonical player
              const identityInsert: PlayerIdentityInsert = {
                canonicalPlayerId: linkedMatch.canonicalPlayerId,
                sourcePlayerId,
                confidenceScore: 1.0,
                matchMethod: "exact",
              };

              yield* db
                .insert(playerIdentityTable)
                .values(identityInsert)
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new IdentityServiceError({
                        message: "Failed to link to existing canonical player",
                        cause,
                      }),
                  ),
                );

              // Get all linked source players
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
                      new IdentityServiceError({
                        message: "Failed to fetch linked sources",
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
              };
            }

            // No existing canonical - create new one
            // Determine primary source (this player or lowest priority match)
            // Lower priority number = more reliable source
            const allCandidates = [
              { sourcePlayerId, leaguePriority: sourcePlayer.leaguePriority },
              ...matches
                .filter((m) => m.canonicalPlayerId === null)
                .map((m) => ({
                  sourcePlayerId: m.sourcePlayerId,
                  leaguePriority: m.leaguePriority,
                })),
            ].toSorted((a, b) => a.leaguePriority - b.leaguePriority);

            const primarySourceId =
              allCandidates[0]?.sourcePlayerId ?? sourcePlayerId;

            // Build display name
            const displayName =
              sourcePlayer.fullName ??
              `${sourcePlayer.firstName ?? ""} ${sourcePlayer.lastName ?? ""}`.trim();

            const canonicalInsert: CanonicalPlayerInsert = {
              primarySourcePlayerId: primarySourceId,
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
                    new IdentityServiceError({
                      message: "Failed to create canonical player",
                      cause,
                    }),
                ),
              );

            if (!newCanonical) {
              return yield* Effect.fail(
                new IdentityServiceError({
                  message: "Failed to create canonical player: no ID returned",
                }),
              );
            }

            // Link all matching source players (including the original)
            const linkedSourcePlayerIds: number[] = [];

            for (const candidate of allCandidates) {
              const identityInsert: PlayerIdentityInsert = {
                canonicalPlayerId: newCanonical.id,
                sourcePlayerId: candidate.sourcePlayerId,
                confidenceScore: 1.0,
                matchMethod: "exact",
              };

              yield* db
                .insert(playerIdentityTable)
                .values(identityInsert)
                .pipe(
                  Effect.mapError(
                    (cause) =>
                      new IdentityServiceError({
                        message: `Failed to link source player ${candidate.sourcePlayerId}`,
                        cause,
                      }),
                  ),
                );

              linkedSourcePlayerIds.push(candidate.sourcePlayerId);
            }

            return {
              canonicalPlayerId: newCanonical.id,
              isNewCanonical: true,
              linkedSourcePlayerIds,
              matchMethod: "exact" as const,
              confidenceScore: 1.0 as const,
            };
          }),
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}
