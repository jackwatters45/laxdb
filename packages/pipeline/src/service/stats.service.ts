import { Effect, Schema, pipe } from "effect";

import { CacheService, CacheKeys, DEFAULT_TTL_CONFIG } from "./cache.service";
import { PlayersRepo } from "./players.repo";
import {
  StatsRepo,
  type PlayerStatWithDetails,
  type StatsCursor,
} from "./stats.repo";

/**
 * Service-level error for business logic failures
 */
export class StatsServiceError extends Schema.TaggedError<StatsServiceError>(
  "StatsServiceError",
)("StatsServiceError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Input for getPlayerStats (canonical player resolution)
 */
export interface GetPlayerStatsInput {
  readonly canonicalPlayerId: number;
  readonly seasonId?: number | undefined;
  readonly limit: number;
  readonly cursor?: StatsCursor | undefined;
}

/**
 * Input for getLeaderboard
 */
export interface GetLeaderboardInput {
  readonly seasonId?: number | undefined;
  readonly leagueIds?: readonly number[] | undefined;
  readonly statType?: "regular" | "playoff" | "career" | undefined;
  readonly sortBy?: "points" | "goals" | "assists" | undefined;
  readonly limit: number;
  readonly cursor?: StatsCursor | undefined;
}

/**
 * Input for comparePlayerStats
 */
export interface ComparePlayerStatsInput {
  readonly canonicalPlayerIds: readonly number[];
  readonly seasonId?: number | undefined;
}

/**
 * Player stats grouped by source (for canonical resolution)
 */
export interface PlayerStatsForCanonical {
  readonly canonicalPlayerId: number;
  readonly displayName: string;
  readonly statsBySource: readonly SourcePlayerStats[];
  readonly aggregatedTotals: AggregatedStats;
}

/**
 * Stats from a specific source player
 */
export interface SourcePlayerStats {
  readonly sourcePlayerId: number;
  readonly leagueAbbreviation: string;
  readonly leaguePriority: number;
  readonly stats: readonly PlayerStatWithDetails[];
}

/**
 * Aggregated stats computed on read
 */
export interface AggregatedStats {
  readonly totalGoals: number;
  readonly totalAssists: number;
  readonly totalPoints: number;
  readonly totalGamesPlayed: number;
  readonly totalGroundBalls: number;
  readonly totalTurnovers: number;
  readonly totalCausedTurnovers: number;
  readonly totalFaceoffWins: number;
  readonly totalFaceoffLosses: number;
}

/**
 * Leaderboard entry with player info
 */
export interface LeaderboardEntry {
  readonly rank: number;
  readonly playerName: string | null;
  readonly teamName: string;
  readonly leagueAbbreviation: string;
  readonly seasonYear: number;
  readonly stats: PlayerStatWithDetails;
}

/**
 * Comparison result for multiple players
 */
export interface PlayerComparison {
  readonly players: readonly PlayerComparisonEntry[];
}

/**
 * Single player in comparison
 */
export interface PlayerComparisonEntry {
  readonly canonicalPlayerId: number;
  readonly displayName: string;
  readonly totals: AggregatedStats;
  readonly statsByLeague: readonly LeagueStats[];
}

/**
 * Stats grouped by league for comparison
 */
export interface LeagueStats {
  readonly leagueAbbreviation: string;
  readonly goals: number;
  readonly assists: number;
  readonly points: number;
  readonly gamesPlayed: number;
}

/**
 * Compute aggregated totals from stats array (on read, per YAGNI)
 */
const computeAggregatedTotals = (
  stats: readonly PlayerStatWithDetails[],
): AggregatedStats => {
  return stats.reduce(
    (acc, stat) => ({
      totalGoals: acc.totalGoals + (stat.goals ?? 0),
      totalAssists: acc.totalAssists + (stat.assists ?? 0),
      totalPoints: acc.totalPoints + (stat.points ?? 0),
      totalGamesPlayed: acc.totalGamesPlayed + (stat.gamesPlayed ?? 0),
      totalGroundBalls: acc.totalGroundBalls + (stat.groundBalls ?? 0),
      totalTurnovers: acc.totalTurnovers + (stat.turnovers ?? 0),
      totalCausedTurnovers:
        acc.totalCausedTurnovers + (stat.causedTurnovers ?? 0),
      totalFaceoffWins: acc.totalFaceoffWins + (stat.faceoffWins ?? 0),
      totalFaceoffLosses: acc.totalFaceoffLosses + (stat.faceoffLosses ?? 0),
    }),
    {
      totalGoals: 0,
      totalAssists: 0,
      totalPoints: 0,
      totalGamesPlayed: 0,
      totalGroundBalls: 0,
      totalTurnovers: 0,
      totalCausedTurnovers: 0,
      totalFaceoffWins: 0,
      totalFaceoffLosses: 0,
    },
  );
};

/**
 * Group stats by league for display (never merge cross-league stats)
 */
const groupStatsByLeague = (
  stats: readonly PlayerStatWithDetails[],
): readonly LeagueStats[] => {
  const byLeague = new Map<string, LeagueStats>();

  for (const stat of stats) {
    const existing = byLeague.get(stat.leagueAbbreviation);
    if (existing) {
      byLeague.set(stat.leagueAbbreviation, {
        leagueAbbreviation: stat.leagueAbbreviation,
        goals: existing.goals + (stat.goals ?? 0),
        assists: existing.assists + (stat.assists ?? 0),
        points: existing.points + (stat.points ?? 0),
        gamesPlayed: existing.gamesPlayed + (stat.gamesPlayed ?? 0),
      });
    } else {
      byLeague.set(stat.leagueAbbreviation, {
        leagueAbbreviation: stat.leagueAbbreviation,
        goals: stat.goals ?? 0,
        assists: stat.assists ?? 0,
        points: stat.points ?? 0,
        gamesPlayed: stat.gamesPlayed ?? 0,
      });
    }
  }

  return Array.from(byLeague.values());
};

export class StatsService extends Effect.Service<StatsService>()(
  "StatsService",
  {
    effect: Effect.gen(function* () {
      const statsRepo = yield* StatsRepo;
      const playersRepo = yield* PlayersRepo;
      const cacheService = yield* CacheService;

      /**
       * Fetch player stats from DB (uncached computation)
       */
      const fetchPlayerStatsUncached = (
        input: GetPlayerStatsInput,
      ): Effect.Effect<PlayerStatsForCanonical, StatsServiceError> =>
        Effect.gen(function* () {
          // Get canonical player with all linked source players
          const canonicalPlayer = yield* playersRepo
            .getCanonicalPlayer({
              canonicalPlayerId: input.canonicalPlayerId,
            })
            .pipe(
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new StatsServiceError({
                    message: e.message,
                    cause: e,
                  }),
                ),
              ),
              Effect.catchTag("DatabaseError", (e) =>
                Effect.fail(
                  new StatsServiceError({
                    message: "Failed to fetch canonical player",
                    cause: e,
                  }),
                ),
              ),
            );

          // Fetch stats for each source player
          const statsBySource: SourcePlayerStats[] = [];

          for (const sourcePlayer of canonicalPlayer.sourcePlayers) {
            const statsResult = yield* pipe(
              input.seasonId === undefined
                ? statsRepo.getPlayerStats({
                    sourcePlayerId: sourcePlayer.id,
                    limit: input.limit,
                    cursor: input.cursor,
                  })
                : statsRepo.getPlayerStatsBySeason({
                    sourcePlayerId: sourcePlayer.id,
                    seasonId: input.seasonId,
                    limit: input.limit,
                    cursor: input.cursor,
                  }),
              Effect.catchTag("DatabaseError", (e) =>
                Effect.fail(
                  new StatsServiceError({
                    message: `Failed to fetch stats for source player ${sourcePlayer.id}`,
                    cause: e,
                  }),
                ),
              ),
            );

            statsBySource.push({
              sourcePlayerId: sourcePlayer.id,
              leagueAbbreviation: sourcePlayer.leagueAbbreviation,
              leaguePriority: sourcePlayer.leaguePriority,
              stats: statsResult,
            });
          }

          // Sort by league priority (lower is better)
          statsBySource.sort((a, b) => a.leaguePriority - b.leaguePriority);

          // Compute aggregated totals across all sources
          const allStats = statsBySource.flatMap((s) => s.stats);
          const aggregatedTotals = computeAggregatedTotals(allStats);

          return {
            canonicalPlayerId: input.canonicalPlayerId,
            displayName: canonicalPlayer.displayName,
            statsBySource,
            aggregatedTotals,
          } as PlayerStatsForCanonical;
        });

      return {
        /**
         * Get player stats with canonical resolution.
         * Returns stats from all linked source players, grouped by source.
         * Stats are displayed together but NEVER merged across leagues.
         * Results are cached with 1h TTL (season) / 24h TTL (off-season).
         */
        getPlayerStats: (input: GetPlayerStatsInput) => {
          const cacheKey = CacheKeys.playerStats(
            input.canonicalPlayerId,
            input.seasonId,
          );

          return cacheService.getOrSet(
            cacheKey,
            fetchPlayerStatsUncached(input),
          );
        },

        /**
         * Get leaderboard with optional filters.
         * Supports filtering by multiple leagues (display together, don't merge).
         * Results are cached with 5min TTL (leaderboards need fresh data).
         */
        getLeaderboard: (input: GetLeaderboardInput) => {
          const cacheKey = CacheKeys.leaderboard(
            input.leagueIds ?? [],
            input.sortBy ?? "points",
            input.seasonId,
          );

          const fetchLeaderboardUncached = Effect.gen(function* () {
            // If multiple leagues specified, fetch for each and combine
            // If no leagues specified, fetch all
            const leagueIds = input.leagueIds ?? [];

            let allStats: PlayerStatWithDetails[] = [];

            if (leagueIds.length === 0) {
              // No league filter - get all
              const stats = yield* statsRepo
                .getLeaderboard({
                  seasonId: input.seasonId,
                  statType: input.statType,
                  sortBy: input.sortBy,
                  limit: input.limit,
                  cursor: input.cursor,
                })
                .pipe(
                  Effect.catchTag("DatabaseError", (e) =>
                    Effect.fail(
                      new StatsServiceError({
                        message: "Failed to fetch leaderboard",
                        cause: e,
                      }),
                    ),
                  ),
                );
              allStats = stats;
            } else {
              // Fetch for each league separately, then combine
              for (const leagueId of leagueIds) {
                const stats = yield* statsRepo
                  .getLeaderboard({
                    seasonId: input.seasonId,
                    leagueId,
                    statType: input.statType,
                    sortBy: input.sortBy,
                    limit: input.limit,
                    cursor: input.cursor,
                  })
                  .pipe(
                    Effect.catchTag("DatabaseError", (e) =>
                      Effect.fail(
                        new StatsServiceError({
                          message: `Failed to fetch leaderboard for league ${leagueId}`,
                          cause: e,
                        }),
                      ),
                    ),
                  );
                allStats = allStats.concat(stats);
              }

              // Sort combined results by the requested field
              const sortKey =
                input.sortBy === "goals"
                  ? "goals"
                  : input.sortBy === "assists"
                    ? "assists"
                    : "points";
              allStats.sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));

              // Apply limit to combined results
              allStats = allStats.slice(0, input.limit);
            }

            // Add rank to each entry
            const leaderboard: LeaderboardEntry[] = allStats.map(
              (stat, index) => ({
                rank: index + 1,
                playerName: stat.playerName,
                teamName: stat.teamName,
                leagueAbbreviation: stat.leagueAbbreviation,
                seasonYear: stat.seasonYear,
                stats: stat,
              }),
            );

            return leaderboard;
          });

          // Use 5min TTL for leaderboards (same as teamTotals)
          return cacheService.getOrSet(cacheKey, fetchLeaderboardUncached, {
            ttlSeconds: DEFAULT_TTL_CONFIG.teamTotals,
          });
        },

        /**
         * Compare stats for multiple canonical players.
         * Returns stats grouped by league for each player (never merged cross-league).
         */
        comparePlayerStats: (input: ComparePlayerStatsInput) =>
          Effect.gen(function* () {
            const players: PlayerComparisonEntry[] = [];

            for (const canonicalPlayerId of input.canonicalPlayerIds) {
              // Get canonical player
              const canonicalPlayer = yield* playersRepo
                .getCanonicalPlayer({
                  canonicalPlayerId,
                })
                .pipe(
                  Effect.catchTag("NotFoundError", (e) =>
                    Effect.fail(
                      new StatsServiceError({
                        message: e.message,
                        cause: e,
                      }),
                    ),
                  ),
                  Effect.catchTag("DatabaseError", (e) =>
                    Effect.fail(
                      new StatsServiceError({
                        message: `Failed to fetch canonical player ${canonicalPlayerId}`,
                        cause: e,
                      }),
                    ),
                  ),
                );

              // Fetch stats for all linked source players
              const allStats: PlayerStatWithDetails[] = [];

              for (const sourcePlayer of canonicalPlayer.sourcePlayers) {
                const statsResult = yield* pipe(
                  input.seasonId === undefined
                    ? statsRepo.getPlayerStats({
                        sourcePlayerId: sourcePlayer.id,
                        limit: 1000,
                      })
                    : statsRepo.getPlayerStatsBySeason({
                        sourcePlayerId: sourcePlayer.id,
                        seasonId: input.seasonId,
                        limit: 1000, // Get all stats for comparison
                      }),
                  Effect.catchTag("DatabaseError", (e) =>
                    Effect.fail(
                      new StatsServiceError({
                        message: `Failed to fetch stats for comparison`,
                        cause: e,
                      }),
                    ),
                  ),
                );
                allStats.push(...statsResult);
              }

              const totals = computeAggregatedTotals(allStats);
              const statsByLeague = groupStatsByLeague(allStats);

              players.push({
                canonicalPlayerId,
                displayName: canonicalPlayer.displayName,
                totals,
                statsByLeague,
              });
            }

            return { players } as PlayerComparison;
          }),
      } as const;
    }),
    dependencies: [StatsRepo.Default, PlayersRepo.Default, CacheService.Default],
  },
) {}
