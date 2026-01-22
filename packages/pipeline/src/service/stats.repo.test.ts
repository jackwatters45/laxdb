import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";

import {
  StatsRepo,
  DatabaseError,
  NotFoundError,
  type StatsCursor,
  type GetPlayerStatsInput,
  type GetPlayerStatsBySeasonInput,
  type GetTeamStatsInput,
  type GetLeaderboardInput,
  type PlayerStatWithDetails,
} from "./stats.repo";

describe("StatsRepo", () => {
  describe("types", () => {
    it("exports correct input types", () => {
      // Type-level tests - these compile-time check our interfaces
      const playerStatsInput: GetPlayerStatsInput = {
        sourcePlayerId: 1,
        limit: 10,
      };
      expect(playerStatsInput.sourcePlayerId).toBe(1);

      const playerStatsBySeasonInput: GetPlayerStatsBySeasonInput = {
        sourcePlayerId: 1,
        seasonId: 2,
        limit: 10,
      };
      expect(playerStatsBySeasonInput.seasonId).toBe(2);

      const teamStatsInput: GetTeamStatsInput = {
        teamId: 1,
        limit: 10,
      };
      expect(teamStatsInput.teamId).toBe(1);

      const leaderboardInput: GetLeaderboardInput = {
        limit: 50,
        sortBy: "points",
      };
      expect(leaderboardInput.sortBy).toBe("points");
    });

    it("exports correct cursor type", () => {
      const cursor: StatsCursor = {
        points: 100,
        id: 42,
      };
      expect(cursor.points).toBe(100);
      expect(cursor.id).toBe(42);
    });

    it("supports optional cursor in pagination inputs", () => {
      const withCursor: GetPlayerStatsInput = {
        sourcePlayerId: 1,
        limit: 10,
        cursor: { points: 50, id: 10 },
      };
      expect(withCursor.cursor?.points).toBe(50);

      const withoutCursor: GetPlayerStatsInput = {
        sourcePlayerId: 1,
        limit: 10,
      };
      expect(withoutCursor.cursor).toBeUndefined();
    });

    it("leaderboard input supports all sort options", () => {
      const byPoints: GetLeaderboardInput = { limit: 10, sortBy: "points" };
      const byGoals: GetLeaderboardInput = { limit: 10, sortBy: "goals" };
      const byAssists: GetLeaderboardInput = { limit: 10, sortBy: "assists" };

      expect(byPoints.sortBy).toBe("points");
      expect(byGoals.sortBy).toBe("goals");
      expect(byAssists.sortBy).toBe("assists");
    });

    it("leaderboard input supports all filter options", () => {
      const withFilters: GetLeaderboardInput = {
        limit: 10,
        seasonId: 1,
        leagueId: 2,
        statType: "regular",
      };

      expect(withFilters.seasonId).toBe(1);
      expect(withFilters.leagueId).toBe(2);
      expect(withFilters.statType).toBe("regular");
    });

    it("supports all stat types", () => {
      const regular: GetLeaderboardInput = { limit: 10, statType: "regular" };
      const playoff: GetLeaderboardInput = { limit: 10, statType: "playoff" };
      const career: GetLeaderboardInput = { limit: 10, statType: "career" };

      expect(regular.statType).toBe("regular");
      expect(playoff.statType).toBe("playoff");
      expect(career.statType).toBe("career");
    });
  });

  describe("error types", () => {
    it.effect("DatabaseError has correct tag", () =>
      Effect.gen(function* () {
        const error = new DatabaseError({
          message: "Connection failed",
          cause: new Error("timeout"),
        });

        expect(error._tag).toBe("DatabaseError");
        expect(error.message).toBe("Connection failed");
      }),
    );

    it.effect("NotFoundError has correct tag and fields", () =>
      Effect.gen(function* () {
        const error = new NotFoundError({
          message: "Player stat not found",
          resourceType: "PlayerStat",
          resourceId: 123,
        });

        expect(error._tag).toBe("NotFoundError");
        expect(error.resourceType).toBe("PlayerStat");
        expect(error.resourceId).toBe(123);
      }),
    );

    it.effect("NotFoundError supports string resourceId", () =>
      Effect.gen(function* () {
        const error = new NotFoundError({
          message: "Player not found",
          resourceType: "Player",
          resourceId: "abc-123",
        });

        expect(error.resourceId).toBe("abc-123");
      }),
    );
  });

  describe("service definition", () => {
    it("StatsRepo is a valid Effect service", () => {
      // Verify StatsRepo extends Effect.Service
      expect(StatsRepo).toBeDefined();
      // The service tag should be "StatsRepo"
      expect(StatsRepo.key).toBe("StatsRepo");
    });

    it("StatsRepo.Default provides the service layer", () => {
      // StatsRepo.Default should be a Layer
      expect(StatsRepo.Default).toBeDefined();
    });
  });

  describe("PlayerStatWithDetails type", () => {
    it("includes all expected fields", () => {
      // Type-check that PlayerStatWithDetails has all the fields we expect
      const mockStat: PlayerStatWithDetails = {
        id: 1,
        sourcePlayerId: 10,
        seasonId: 20,
        teamId: 30,
        gameId: "game-123",
        statType: "regular",
        goals: 5,
        assists: 10,
        points: 15,
        shots: 20,
        shotsOnGoal: 15,
        groundBalls: 8,
        turnovers: 3,
        causedTurnovers: 4,
        faceoffWins: 10,
        faceoffLosses: 5,
        saves: 0,
        goalsAgainst: 0,
        gamesPlayed: 12,
        sourceHash: "abc123",
        createdAt: new Date(),
        updatedAt: null,
        // Joined fields
        playerName: "John Doe",
        teamName: "Atlas LC",
        seasonYear: 2024,
        leagueAbbreviation: "PLL",
      };

      expect(mockStat.playerName).toBe("John Doe");
      expect(mockStat.teamName).toBe("Atlas LC");
      expect(mockStat.seasonYear).toBe(2024);
      expect(mockStat.leagueAbbreviation).toBe("PLL");
    });

    it("allows null playerName", () => {
      const mockStat: PlayerStatWithDetails = {
        id: 1,
        sourcePlayerId: 10,
        seasonId: 20,
        teamId: 30,
        gameId: null,
        statType: "regular",
        goals: 0,
        assists: 0,
        points: 0,
        shots: 0,
        shotsOnGoal: 0,
        groundBalls: 0,
        turnovers: 0,
        causedTurnovers: 0,
        faceoffWins: 0,
        faceoffLosses: 0,
        saves: 0,
        goalsAgainst: 0,
        gamesPlayed: 0,
        sourceHash: null,
        createdAt: new Date(),
        updatedAt: null,
        playerName: null,
        teamName: "Test Team",
        seasonYear: 2024,
        leagueAbbreviation: "NLL",
      };

      expect(mockStat.playerName).toBeNull();
      expect(mockStat.gameId).toBeNull();
    });
  });
});
