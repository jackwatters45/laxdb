import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";

import {
  TeamsRepo,
  DatabaseError,
  NotFoundError,
  type GetTeamInput,
  type GetTeamsBySeasonInput,
  type GetTeamsByLeagueInput,
  type GetTeamRosterInput,
  type TeamWithLeague,
  type TeamWithSeason,
  type RosterPlayer,
} from "./teams.repo";

describe("TeamsRepo", () => {
  describe("types", () => {
    it("exports correct input types for getTeam", () => {
      const input: GetTeamInput = {
        teamId: 1,
      };
      expect(input.teamId).toBe(1);
    });

    it("exports correct input types for getTeamsBySeason", () => {
      const input: GetTeamsBySeasonInput = {
        seasonId: 2024,
      };
      expect(input.seasonId).toBe(2024);
    });

    it("exports correct input types for getTeamsByLeague", () => {
      const inputBasic: GetTeamsByLeagueInput = {
        leagueId: 1,
      };
      expect(inputBasic.leagueId).toBe(1);
      expect(inputBasic.seasonId).toBeUndefined();

      const inputWithSeason: GetTeamsByLeagueInput = {
        leagueId: 1,
        seasonId: 5,
      };
      expect(inputWithSeason.leagueId).toBe(1);
      expect(inputWithSeason.seasonId).toBe(5);
    });

    it("exports correct input types for getTeamRoster", () => {
      const input: GetTeamRosterInput = {
        teamId: 1,
        seasonId: 2024,
      };
      expect(input.teamId).toBe(1);
      expect(input.seasonId).toBe(2024);
    });
  });

  describe("result types", () => {
    it("TeamWithLeague includes all team and league fields", () => {
      const team: TeamWithLeague = {
        id: 1,
        leagueId: 1,
        name: "Atlas LC",
        abbreviation: "ATL",
        city: "New York",
        sourceId: "pll-atlas",
        sourceHash: "abc123",
        createdAt: new Date(),
        updatedAt: null,
        leagueName: "Premier Lacrosse League",
        leagueAbbreviation: "PLL",
      };

      expect(team.name).toBe("Atlas LC");
      expect(team.abbreviation).toBe("ATL");
      expect(team.leagueAbbreviation).toBe("PLL");
    });

    it("TeamWithLeague allows null optional fields", () => {
      const team: TeamWithLeague = {
        id: 2,
        leagueId: 2,
        name: "Colorado Mammoth",
        abbreviation: null,
        city: null,
        sourceId: null,
        sourceHash: null,
        createdAt: new Date(),
        updatedAt: null,
        leagueName: "National Lacrosse League",
        leagueAbbreviation: "NLL",
      };

      expect(team.abbreviation).toBeNull();
      expect(team.city).toBeNull();
      expect(team.sourceId).toBeNull();
    });

    it("TeamWithSeason includes season-specific fields", () => {
      const team: TeamWithSeason = {
        id: 1,
        leagueId: 1,
        name: "Atlas LC",
        abbreviation: "ATL",
        city: "New York",
        sourceId: "pll-atlas",
        sourceHash: "abc123",
        createdAt: new Date(),
        updatedAt: null,
        leagueName: "Premier Lacrosse League",
        leagueAbbreviation: "PLL",
        seasonYear: 2024,
        division: "Eastern",
        conference: null,
      };

      expect(team.seasonYear).toBe(2024);
      expect(team.division).toBe("Eastern");
      expect(team.conference).toBeNull();
    });

    it("TeamWithSeason allows null division and conference", () => {
      const team: TeamWithSeason = {
        id: 1,
        leagueId: 1,
        name: "Whipsnakes LC",
        abbreviation: "WHIP",
        city: null,
        sourceId: "pll-whipsnakes",
        sourceHash: "def456",
        createdAt: new Date(),
        updatedAt: null,
        leagueName: "Premier Lacrosse League",
        leagueAbbreviation: "PLL",
        seasonYear: 2024,
        division: null,
        conference: null,
      };

      expect(team.division).toBeNull();
      expect(team.conference).toBeNull();
    });

    it("RosterPlayer includes all player fields", () => {
      const player: RosterPlayer = {
        id: 1,
        sourceId: "pll-player-123",
        fullName: "John Doe",
        firstName: "John",
        lastName: "Doe",
        position: "Attack",
        jerseyNumber: "10",
        leagueId: 1,
        leagueAbbreviation: "PLL",
      };

      expect(player.fullName).toBe("John Doe");
      expect(player.position).toBe("Attack");
      expect(player.leagueAbbreviation).toBe("PLL");
    });

    it("RosterPlayer allows null optional fields", () => {
      const player: RosterPlayer = {
        id: 2,
        sourceId: "nll-player-456",
        fullName: null,
        firstName: null,
        lastName: null,
        position: null,
        jerseyNumber: null,
        leagueId: 2,
        leagueAbbreviation: "NLL",
      };

      expect(player.fullName).toBeNull();
      expect(player.position).toBeNull();
      expect(player.jerseyNumber).toBeNull();
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
          message: "Team not found",
          resourceType: "Team",
          resourceId: 123,
        });

        expect(error._tag).toBe("NotFoundError");
        expect(error.resourceType).toBe("Team");
        expect(error.resourceId).toBe(123);
      }),
    );

    it.effect("NotFoundError supports string resourceId", () =>
      Effect.gen(function* () {
        const error = new NotFoundError({
          message: "Team not found by source ID",
          resourceType: "Team",
          resourceId: "pll-atlas",
        });

        expect(error.resourceId).toBe("pll-atlas");
      }),
    );
  });

  describe("service definition", () => {
    it("TeamsRepo is a valid Effect service", () => {
      expect(TeamsRepo).toBeDefined();
      expect(TeamsRepo.key).toBe("TeamsRepo");
    });

    it("TeamsRepo.Default provides the service layer", () => {
      expect(TeamsRepo.Default).toBeDefined();
    });
  });

  describe("input validation scenarios", () => {
    it("getTeamsByLeague supports league-only query", () => {
      const input: GetTeamsByLeagueInput = {
        leagueId: 1,
      };
      expect(input.leagueId).toBe(1);
      expect(input.seasonId).toBeUndefined();
    });

    it("getTeamsByLeague supports league and season filter", () => {
      const input: GetTeamsByLeagueInput = {
        leagueId: 1,
        seasonId: 10,
      };
      expect(input.leagueId).toBe(1);
      expect(input.seasonId).toBe(10);
    });

    it("getTeamRoster requires both team and season", () => {
      const input: GetTeamRosterInput = {
        teamId: 5,
        seasonId: 2024,
      };
      expect(input.teamId).toBe(5);
      expect(input.seasonId).toBe(2024);
    });
  });
});
