import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";

import {
  PlayersRepo,
  DatabaseError,
  NotFoundError,
  type GetPlayerInput,
  type GetPlayerBySourceIdInput,
  type SearchPlayersInput,
  type GetCanonicalPlayerInput,
  type SourcePlayerWithLeague,
  type CanonicalPlayerWithSources,
} from "./players.repo";

describe("PlayersRepo", () => {
  describe("types", () => {
    it("exports correct input types for getPlayer", () => {
      const input: GetPlayerInput = {
        sourcePlayerId: 1,
      };
      expect(input.sourcePlayerId).toBe(1);
    });

    it("exports correct input types for getPlayerBySourceId", () => {
      const input: GetPlayerBySourceIdInput = {
        leagueId: 1,
        sourceId: "pll-123",
      };
      expect(input.leagueId).toBe(1);
      expect(input.sourceId).toBe("pll-123");
    });

    it("exports correct input types for searchPlayers", () => {
      const inputBasic: SearchPlayersInput = {
        query: "John Doe",
        limit: 10,
      };
      expect(inputBasic.query).toBe("John Doe");
      expect(inputBasic.limit).toBe(10);
      expect(inputBasic.leagueId).toBeUndefined();

      const inputWithLeague: SearchPlayersInput = {
        query: "John",
        leagueId: 2,
        limit: 20,
      };
      expect(inputWithLeague.leagueId).toBe(2);
    });

    it("exports correct input types for getCanonicalPlayer", () => {
      const input: GetCanonicalPlayerInput = {
        canonicalPlayerId: 42,
      };
      expect(input.canonicalPlayerId).toBe(42);
    });
  });

  describe("result types", () => {
    it("SourcePlayerWithLeague includes all player and league fields", () => {
      const player: SourcePlayerWithLeague = {
        id: 1,
        leagueId: 1,
        sourceId: "pll-abc",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        normalizedName: "john doe",
        position: "Attack",
        jerseyNumber: "10",
        dob: new Date("1995-03-15"),
        hometown: "Baltimore, MD",
        college: "Johns Hopkins",
        handedness: "Right",
        heightInches: 72,
        weightLbs: 185,
        sourceHash: "abc123",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        leagueName: "Premier Lacrosse League",
        leagueAbbreviation: "PLL",
        leaguePriority: 1,
      };

      expect(player.fullName).toBe("John Doe");
      expect(player.leagueAbbreviation).toBe("PLL");
      expect(player.leaguePriority).toBe(1);
    });

    it("SourcePlayerWithLeague allows null optional fields", () => {
      const player: SourcePlayerWithLeague = {
        id: 2,
        leagueId: 2,
        sourceId: "nll-xyz",
        firstName: null,
        lastName: null,
        fullName: "Jane Smith",
        normalizedName: "jane smith",
        position: null,
        jerseyNumber: null,
        dob: null,
        hometown: null,
        college: null,
        handedness: null,
        heightInches: null,
        weightLbs: null,
        sourceHash: null,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        leagueName: "National Lacrosse League",
        leagueAbbreviation: "NLL",
        leaguePriority: 2,
      };

      expect(player.firstName).toBeNull();
      expect(player.dob).toBeNull();
      expect(player.college).toBeNull();
    });

    it("CanonicalPlayerWithSources includes canonical fields and source players", () => {
      const sourcePlayer: SourcePlayerWithLeague = {
        id: 1,
        leagueId: 1,
        sourceId: "pll-abc",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        normalizedName: "john doe",
        position: "Attack",
        jerseyNumber: "10",
        dob: new Date("1995-03-15"),
        hometown: "Baltimore, MD",
        college: "Johns Hopkins",
        handedness: "Right",
        heightInches: 72,
        weightLbs: 185,
        sourceHash: "abc123",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        leagueName: "Premier Lacrosse League",
        leagueAbbreviation: "PLL",
        leaguePriority: 1,
      };

      const canonical: CanonicalPlayerWithSources = {
        id: 100,
        primarySourcePlayerId: 1,
        displayName: "John Doe",
        position: "Attack",
        dob: new Date("1995-03-15"),
        hometown: "Baltimore, MD",
        college: "Johns Hopkins",
        createdAt: new Date(),
        updatedAt: null,
        sourcePlayers: [sourcePlayer],
      };

      expect(canonical.displayName).toBe("John Doe");
      expect(canonical.primarySourcePlayerId).toBe(1);
      expect(canonical.sourcePlayers).toHaveLength(1);
      expect(canonical.sourcePlayers[0]?.leagueAbbreviation).toBe("PLL");
    });

    it("CanonicalPlayerWithSources supports multiple source players", () => {
      const pllPlayer: SourcePlayerWithLeague = {
        id: 1,
        leagueId: 1,
        sourceId: "pll-abc",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        normalizedName: "john doe",
        position: "Attack",
        jerseyNumber: "10",
        dob: new Date("1995-03-15"),
        hometown: "Baltimore, MD",
        college: "Johns Hopkins",
        handedness: "Right",
        heightInches: 72,
        weightLbs: 185,
        sourceHash: "abc123",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        leagueName: "Premier Lacrosse League",
        leagueAbbreviation: "PLL",
        leaguePriority: 1,
      };

      const nllPlayer: SourcePlayerWithLeague = {
        id: 2,
        leagueId: 2,
        sourceId: "nll-xyz",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        normalizedName: "john doe",
        position: "Forward",
        jerseyNumber: "22",
        dob: new Date("1995-03-15"),
        hometown: "Baltimore, MD",
        college: "Johns Hopkins",
        handedness: "Right",
        heightInches: 72,
        weightLbs: 185,
        sourceHash: "xyz789",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        leagueName: "National Lacrosse League",
        leagueAbbreviation: "NLL",
        leaguePriority: 2,
      };

      const canonical: CanonicalPlayerWithSources = {
        id: 100,
        primarySourcePlayerId: 1,
        displayName: "John Doe",
        position: "Attack",
        dob: new Date("1995-03-15"),
        hometown: "Baltimore, MD",
        college: "Johns Hopkins",
        createdAt: new Date(),
        updatedAt: null,
        sourcePlayers: [pllPlayer, nllPlayer],
      };

      expect(canonical.sourcePlayers).toHaveLength(2);
      expect(canonical.sourcePlayers[0]?.leagueAbbreviation).toBe("PLL");
      expect(canonical.sourcePlayers[1]?.leagueAbbreviation).toBe("NLL");
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
          message: "Player not found",
          resourceType: "SourcePlayer",
          resourceId: 123,
        });

        expect(error._tag).toBe("NotFoundError");
        expect(error.resourceType).toBe("SourcePlayer");
        expect(error.resourceId).toBe(123);
      }),
    );

    it.effect("NotFoundError supports string resourceId", () =>
      Effect.gen(function* () {
        const error = new NotFoundError({
          message: "Player not found by source ID",
          resourceType: "SourcePlayer",
          resourceId: "pll-abc-123",
        });

        expect(error.resourceId).toBe("pll-abc-123");
      }),
    );

    it.effect("NotFoundError for CanonicalPlayer", () =>
      Effect.gen(function* () {
        const error = new NotFoundError({
          message: "Canonical player not found",
          resourceType: "CanonicalPlayer",
          resourceId: 42,
        });

        expect(error.resourceType).toBe("CanonicalPlayer");
        expect(error.resourceId).toBe(42);
      }),
    );
  });

  describe("service definition", () => {
    it("PlayersRepo is a valid Effect service", () => {
      expect(PlayersRepo).toBeDefined();
      expect(PlayersRepo.key).toBe("PlayersRepo");
    });

    it("PlayersRepo.Default provides the service layer", () => {
      expect(PlayersRepo.Default).toBeDefined();
    });
  });

  describe("search input normalization", () => {
    it("search input supports various query formats", () => {
      // Basic name search
      const basicSearch: SearchPlayersInput = {
        query: "John Doe",
        limit: 10,
      };
      expect(basicSearch.query).toBe("John Doe");

      // Partial name search
      const partialSearch: SearchPlayersInput = {
        query: "Joh",
        limit: 10,
      };
      expect(partialSearch.query).toBe("Joh");

      // Name with special characters (will be handled by normalization)
      const accentSearch: SearchPlayersInput = {
        query: "José",
        limit: 10,
      };
      expect(accentSearch.query).toBe("José");
    });

    it("search input with league filter", () => {
      const withPLL: SearchPlayersInput = {
        query: "Smith",
        leagueId: 1,
        limit: 20,
      };
      expect(withPLL.leagueId).toBe(1);

      const withNLL: SearchPlayersInput = {
        query: "Smith",
        leagueId: 2,
        limit: 20,
      };
      expect(withNLL.leagueId).toBe(2);
    });
  });
});
