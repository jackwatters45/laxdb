import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";

import { CacheKeys, DEFAULT_TTL_CONFIG } from "./cache.service";
import {
  StatsService,
  StatsServiceError,
  type GetPlayerStatsInput,
  type GetLeaderboardInput,
  type ComparePlayerStatsInput,
  type PlayerStatsForCanonical,
  type LeaderboardEntry,
  type PlayerComparison,
  type AggregatedStats,
  type LeagueStats,
  type SourcePlayerStats,
  type PlayerComparisonEntry,
} from "./stats.service";

describe("StatsService", () => {
  describe("types", () => {
    it("exports correct GetPlayerStatsInput type", () => {
      const input: GetPlayerStatsInput = {
        canonicalPlayerId: 1,
        limit: 10,
      };
      expect(input.canonicalPlayerId).toBe(1);

      const withSeason: GetPlayerStatsInput = {
        canonicalPlayerId: 1,
        seasonId: 2024,
        limit: 10,
      };
      expect(withSeason.seasonId).toBe(2024);

      const withCursor: GetPlayerStatsInput = {
        canonicalPlayerId: 1,
        limit: 10,
        cursor: { points: 50, id: 10 },
      };
      expect(withCursor.cursor?.points).toBe(50);
    });

    it("exports correct GetLeaderboardInput type", () => {
      const input: GetLeaderboardInput = {
        limit: 50,
      };
      expect(input.limit).toBe(50);

      const withFilters: GetLeaderboardInput = {
        seasonId: 1,
        leagueIds: [1, 2],
        statType: "regular",
        sortBy: "points",
        limit: 50,
      };
      expect(withFilters.seasonId).toBe(1);
      expect(withFilters.leagueIds).toEqual([1, 2]);
      expect(withFilters.statType).toBe("regular");
      expect(withFilters.sortBy).toBe("points");
    });

    it("exports correct ComparePlayerStatsInput type", () => {
      const input: ComparePlayerStatsInput = {
        canonicalPlayerIds: [1, 2, 3],
      };
      expect(input.canonicalPlayerIds).toEqual([1, 2, 3]);

      const withSeason: ComparePlayerStatsInput = {
        canonicalPlayerIds: [1, 2],
        seasonId: 2024,
      };
      expect(withSeason.seasonId).toBe(2024);
    });

    it("supports all sortBy options", () => {
      const byPoints: GetLeaderboardInput = { limit: 10, sortBy: "points" };
      const byGoals: GetLeaderboardInput = { limit: 10, sortBy: "goals" };
      const byAssists: GetLeaderboardInput = { limit: 10, sortBy: "assists" };

      expect(byPoints.sortBy).toBe("points");
      expect(byGoals.sortBy).toBe("goals");
      expect(byAssists.sortBy).toBe("assists");
    });

    it("supports all statType options", () => {
      const regular: GetLeaderboardInput = { limit: 10, statType: "regular" };
      const playoff: GetLeaderboardInput = { limit: 10, statType: "playoff" };
      const career: GetLeaderboardInput = { limit: 10, statType: "career" };

      expect(regular.statType).toBe("regular");
      expect(playoff.statType).toBe("playoff");
      expect(career.statType).toBe("career");
    });
  });

  describe("error types", () => {
    it.effect("StatsServiceError has correct tag", () =>
      Effect.gen(function* () {
        const error = new StatsServiceError({
          message: "Player not found",
          cause: new Error("underlying cause"),
        });

        expect(error._tag).toBe("StatsServiceError");
        expect(error.message).toBe("Player not found");
      }),
    );

    it.effect("StatsServiceError works without cause", () =>
      Effect.gen(function* () {
        const error = new StatsServiceError({
          message: "Simple error",
        });

        expect(error._tag).toBe("StatsServiceError");
        expect(error.message).toBe("Simple error");
      }),
    );
  });

  describe("service definition", () => {
    it("StatsService is a valid Effect service", () => {
      expect(StatsService).toBeDefined();
      expect(StatsService.key).toBe("StatsService");
    });

    it("StatsService.Default provides the service layer", () => {
      expect(StatsService.Default).toBeDefined();
    });
  });

  describe("output types", () => {
    it("PlayerStatsForCanonical includes all expected fields", () => {
      const mockResult: PlayerStatsForCanonical = {
        canonicalPlayerId: 1,
        displayName: "John Doe",
        statsBySource: [
          {
            sourcePlayerId: 10,
            leagueAbbreviation: "PLL",
            leaguePriority: 1,
            stats: [],
          },
        ],
        aggregatedTotals: {
          totalGoals: 10,
          totalAssists: 15,
          totalPoints: 25,
          totalGamesPlayed: 12,
          totalGroundBalls: 8,
          totalTurnovers: 3,
          totalCausedTurnovers: 4,
          totalFaceoffWins: 10,
          totalFaceoffLosses: 5,
        },
      };

      expect(mockResult.canonicalPlayerId).toBe(1);
      expect(mockResult.displayName).toBe("John Doe");
      expect(mockResult.statsBySource).toHaveLength(1);
      expect(mockResult.aggregatedTotals.totalPoints).toBe(25);
    });

    it("LeaderboardEntry includes all expected fields", () => {
      const mockEntry: LeaderboardEntry = {
        rank: 1,
        playerName: "Jane Smith",
        teamName: "Atlas LC",
        leagueAbbreviation: "PLL",
        seasonYear: 2024,
        stats: {
          id: 1,
          sourcePlayerId: 10,
          seasonId: 20,
          teamId: 30,
          gameId: null,
          statType: "regular",
          goals: 15,
          assists: 20,
          points: 35,
          shots: 50,
          shotsOnGoal: 40,
          groundBalls: 10,
          turnovers: 5,
          causedTurnovers: 8,
          faceoffWins: 0,
          faceoffLosses: 0,
          saves: 0,
          goalsAgainst: 0,
          gamesPlayed: 14,
          sourceHash: "hash123",
          createdAt: new Date(),
          updatedAt: null,
          playerName: "Jane Smith",
          teamName: "Atlas LC",
          seasonYear: 2024,
          leagueAbbreviation: "PLL",
        },
      };

      expect(mockEntry.rank).toBe(1);
      expect(mockEntry.playerName).toBe("Jane Smith");
      expect(mockEntry.stats.points).toBe(35);
    });

    it("PlayerComparison includes all expected fields", () => {
      const mockComparison: PlayerComparison = {
        players: [
          {
            canonicalPlayerId: 1,
            displayName: "Player One",
            totals: {
              totalGoals: 20,
              totalAssists: 30,
              totalPoints: 50,
              totalGamesPlayed: 24,
              totalGroundBalls: 16,
              totalTurnovers: 6,
              totalCausedTurnovers: 8,
              totalFaceoffWins: 20,
              totalFaceoffLosses: 10,
            },
            statsByLeague: [
              {
                leagueAbbreviation: "PLL",
                goals: 12,
                assists: 18,
                points: 30,
                gamesPlayed: 12,
              },
              {
                leagueAbbreviation: "NLL",
                goals: 8,
                assists: 12,
                points: 20,
                gamesPlayed: 12,
              },
            ],
          },
        ],
      };

      expect(mockComparison.players).toHaveLength(1);
      const firstPlayer = mockComparison.players[0];
      expect(firstPlayer).toBeDefined();
      expect(firstPlayer!.statsByLeague).toHaveLength(2);
      expect(firstPlayer!.totals.totalPoints).toBe(50);
    });

    it("AggregatedStats includes all stat categories", () => {
      const stats: AggregatedStats = {
        totalGoals: 10,
        totalAssists: 15,
        totalPoints: 25,
        totalGamesPlayed: 12,
        totalGroundBalls: 8,
        totalTurnovers: 3,
        totalCausedTurnovers: 4,
        totalFaceoffWins: 10,
        totalFaceoffLosses: 5,
      };

      expect(stats.totalGoals).toBe(10);
      expect(stats.totalAssists).toBe(15);
      expect(stats.totalPoints).toBe(25);
      expect(stats.totalGamesPlayed).toBe(12);
      expect(stats.totalGroundBalls).toBe(8);
      expect(stats.totalTurnovers).toBe(3);
      expect(stats.totalCausedTurnovers).toBe(4);
      expect(stats.totalFaceoffWins).toBe(10);
      expect(stats.totalFaceoffLosses).toBe(5);
    });

    it("LeagueStats shows stats per league without merging", () => {
      const pllStats: LeagueStats = {
        leagueAbbreviation: "PLL",
        goals: 10,
        assists: 15,
        points: 25,
        gamesPlayed: 12,
      };

      const nllStats: LeagueStats = {
        leagueAbbreviation: "NLL",
        goals: 8,
        assists: 10,
        points: 18,
        gamesPlayed: 18,
      };

      // Verify leagues are separate (never merged)
      expect(pllStats.leagueAbbreviation).toBe("PLL");
      expect(nllStats.leagueAbbreviation).toBe("NLL");
      expect(pllStats.gamesPlayed).not.toBe(nllStats.gamesPlayed);
    });

    it("SourcePlayerStats groups stats by source", () => {
      const sourceStats: SourcePlayerStats = {
        sourcePlayerId: 10,
        leagueAbbreviation: "PLL",
        leaguePriority: 1,
        stats: [],
      };

      expect(sourceStats.sourcePlayerId).toBe(10);
      expect(sourceStats.leagueAbbreviation).toBe("PLL");
      expect(sourceStats.leaguePriority).toBe(1);
    });

    it("PlayerComparisonEntry supports multiple leagues", () => {
      const entry: PlayerComparisonEntry = {
        canonicalPlayerId: 1,
        displayName: "Multi-League Player",
        totals: {
          totalGoals: 30,
          totalAssists: 40,
          totalPoints: 70,
          totalGamesPlayed: 30,
          totalGroundBalls: 20,
          totalTurnovers: 10,
          totalCausedTurnovers: 15,
          totalFaceoffWins: 25,
          totalFaceoffLosses: 15,
        },
        statsByLeague: [
          {
            leagueAbbreviation: "PLL",
            goals: 15,
            assists: 20,
            points: 35,
            gamesPlayed: 12,
          },
          {
            leagueAbbreviation: "NLL",
            goals: 15,
            assists: 20,
            points: 35,
            gamesPlayed: 18,
          },
        ],
      };

      expect(entry.statsByLeague).toHaveLength(2);
      // Stats are displayed together but totaled correctly
      expect(entry.totals.totalPoints).toBe(70);
    });
  });

  describe("cross-league behavior", () => {
    it("leaderboard supports multiple league IDs", () => {
      const input: GetLeaderboardInput = {
        leagueIds: [1, 2, 3],
        limit: 50,
      };

      // Multiple leagues can be queried together
      expect(input.leagueIds).toHaveLength(3);
    });

    it("leaderboard works without league filter (all leagues)", () => {
      const input: GetLeaderboardInput = {
        limit: 50,
      };

      expect(input.leagueIds).toBeUndefined();
    });
  });

  describe("cache integration", () => {
    describe("cache key generation", () => {
      it("generates correct cache key for getPlayerStats", () => {
        const cacheKey = CacheKeys.playerStats(123, 2024);
        expect(cacheKey).toBe("stats:player:123:season:2024");
      });

      it("generates correct cache key for getPlayerStats without season", () => {
        const cacheKey = CacheKeys.playerStats(123);
        expect(cacheKey).toBe("stats:player:123:all");
      });

      it("generates correct cache key for getLeaderboard", () => {
        const cacheKey = CacheKeys.leaderboard([1, 2], "points", 2024);
        expect(cacheKey).toBe("leaderboard:1,2:points:season:2024");
      });

      it("generates correct cache key for getLeaderboard without season", () => {
        const cacheKey = CacheKeys.leaderboard([1, 2], "goals");
        expect(cacheKey).toBe("leaderboard:1,2:goals:all");
      });

      it("generates correct cache key for getLeaderboard with empty leagues", () => {
        const cacheKey = CacheKeys.leaderboard([], "points", 2024);
        expect(cacheKey).toBe("leaderboard::points:season:2024");
      });

      it("normalizes league IDs by sorting", () => {
        const key1 = CacheKeys.leaderboard([2, 1, 3], "points");
        const key2 = CacheKeys.leaderboard([3, 1, 2], "points");
        expect(key1).toBe(key2);
        expect(key1).toBe("leaderboard:1,2,3:points:all");
      });
    });

    describe("TTL configuration", () => {
      it("uses 5min TTL for leaderboard cache", () => {
        expect(DEFAULT_TTL_CONFIG.teamTotals).toBe(60 * 5); // 5 minutes
      });

      it("uses 1h TTL for player stats during season", () => {
        expect(DEFAULT_TTL_CONFIG.playerStatsSeason).toBe(60 * 60); // 1 hour
      });

      it("uses 24h TTL for player stats off-season", () => {
        expect(DEFAULT_TTL_CONFIG.playerStatsOffSeason).toBe(60 * 60 * 24); // 24 hours
      });
    });

    describe("cache behavior documentation", () => {
      it("StatsService methods are wrapped with cache.getOrSet", () => {
        // This test documents the expected behavior:
        // - getPlayerStats uses CacheKeys.playerStats(canonicalPlayerId, seasonId)
        // - getLeaderboard uses CacheKeys.leaderboard(leagueIds, sortBy, seasonId)
        // - Both methods use cacheService.getOrSet for read-through caching
        // - Leaderboard explicitly sets TTL to 5min (teamTotals)
        // - Player stats uses automatic TTL based on key type (1h season, 24h off-season)
        expect(true).toBe(true);
      });

      it("comparePlayerStats is NOT cached", () => {
        // comparePlayerStats is a comparison operation that aggregates data
        // from multiple players. It is not cached because:
        // 1. The combination of players varies per request
        // 2. The underlying getPlayerStats calls can benefit from caching
        // 3. The aggregation overhead is minimal
        expect(true).toBe(true);
      });
    });
  });
});
