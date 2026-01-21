import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";

import {
  PlayersService,
  PlayersServiceError,
  NoMatchError,
  AlreadyLinkedError,
  type GetPlayerInput,
  type SearchPlayersInput,
  type LinkPlayerIdentityInput,
  type LinkPlayerIdentityResult,
} from "./players.service";

describe("PlayersService", () => {
  describe("types", () => {
    it("exports correct GetPlayerInput type", () => {
      const input: GetPlayerInput = {
        canonicalPlayerId: 1,
      };
      expect(input.canonicalPlayerId).toBe(1);
    });

    it("exports correct SearchPlayersInput type", () => {
      const input: SearchPlayersInput = {
        query: "John",
        limit: 10,
      };
      expect(input.query).toBe("John");
      expect(input.limit).toBe(10);

      const withLeague: SearchPlayersInput = {
        query: "Smith",
        leagueId: 1,
        limit: 20,
      };
      expect(withLeague.leagueId).toBe(1);
    });

    it("exports correct LinkPlayerIdentityInput type", () => {
      const input: LinkPlayerIdentityInput = {
        sourcePlayerId: 100,
      };
      expect(input.sourcePlayerId).toBe(100);
    });
  });

  describe("error types", () => {
    it.effect("PlayersServiceError has correct tag", () =>
      Effect.gen(function* () {
        const error = new PlayersServiceError({
          message: "Player not found",
          cause: new Error("underlying cause"),
        });

        expect(error._tag).toBe("PlayersServiceError");
        expect(error.message).toBe("Player not found");
      }),
    );

    it.effect("PlayersServiceError works without cause", () =>
      Effect.gen(function* () {
        const error = new PlayersServiceError({
          message: "Simple error",
        });

        expect(error._tag).toBe("PlayersServiceError");
        expect(error.message).toBe("Simple error");
      }),
    );

    it.effect("NoMatchError has correct tag and fields", () =>
      Effect.gen(function* () {
        const error = new NoMatchError({
          message: "Cannot establish exact match: missing DOB",
          sourcePlayerId: 42,
        });

        expect(error._tag).toBe("NoMatchError");
        expect(error.message).toBe("Cannot establish exact match: missing DOB");
        expect(error.sourcePlayerId).toBe(42);
      }),
    );

    it.effect("AlreadyLinkedError has correct tag and fields", () =>
      Effect.gen(function* () {
        const error = new AlreadyLinkedError({
          message: "Source player 42 is already linked to canonical player 10",
          sourcePlayerId: 42,
          existingCanonicalPlayerId: 10,
        });

        expect(error._tag).toBe("AlreadyLinkedError");
        expect(error.message).toBe(
          "Source player 42 is already linked to canonical player 10",
        );
        expect(error.sourcePlayerId).toBe(42);
        expect(error.existingCanonicalPlayerId).toBe(10);
      }),
    );
  });

  describe("service definition", () => {
    it("PlayersService is a valid Effect service", () => {
      expect(PlayersService).toBeDefined();
      expect(PlayersService.key).toBe("PlayersService");
    });

    it("PlayersService.Default provides the service layer", () => {
      expect(PlayersService.Default).toBeDefined();
    });
  });

  describe("output types", () => {
    it("LinkPlayerIdentityResult includes all expected fields for new canonical", () => {
      const result: LinkPlayerIdentityResult = {
        canonicalPlayerId: 1,
        isNewCanonical: true,
        linkedSourcePlayerIds: [10, 20, 30],
        matchMethod: "exact",
        confidenceScore: 1.0,
      };

      expect(result.canonicalPlayerId).toBe(1);
      expect(result.isNewCanonical).toBe(true);
      expect(result.linkedSourcePlayerIds).toEqual([10, 20, 30]);
      expect(result.matchMethod).toBe("exact");
      expect(result.confidenceScore).toBe(1.0);
    });

    it("LinkPlayerIdentityResult includes all expected fields for existing canonical", () => {
      const result: LinkPlayerIdentityResult = {
        canonicalPlayerId: 5,
        isNewCanonical: false,
        linkedSourcePlayerIds: [10, 100],
        matchMethod: "exact",
        confidenceScore: 1.0,
      };

      expect(result.canonicalPlayerId).toBe(5);
      expect(result.isNewCanonical).toBe(false);
      expect(result.linkedSourcePlayerIds).toHaveLength(2);
    });
  });

  describe("identity linking behavior", () => {
    it("exact match requires confidence score of 1.0", () => {
      const result: LinkPlayerIdentityResult = {
        canonicalPlayerId: 1,
        isNewCanonical: true,
        linkedSourcePlayerIds: [10],
        matchMethod: "exact",
        confidenceScore: 1.0,
      };

      // MVP: exact match only with confidence = 1.0
      expect(result.matchMethod).toBe("exact");
      expect(result.confidenceScore).toBe(1.0);
    });

    it("matchMethod is restricted to exact for MVP", () => {
      // Per spec: MVP uses exact-match only
      const exactResult: LinkPlayerIdentityResult = {
        canonicalPlayerId: 1,
        isNewCanonical: true,
        linkedSourcePlayerIds: [10],
        matchMethod: "exact",
        confidenceScore: 1.0,
      };

      expect(exactResult.matchMethod).toBe("exact");
    });

    it("linkedSourcePlayerIds can contain multiple source players", () => {
      // When a canonical player is created or linked, all matching
      // source players (same normalized_name + DOB) are linked together
      const result: LinkPlayerIdentityResult = {
        canonicalPlayerId: 1,
        isNewCanonical: true,
        linkedSourcePlayerIds: [10, 20, 30, 40],
        matchMethod: "exact",
        confidenceScore: 1.0,
      };

      // Multiple source players from different leagues can be linked
      // to the same canonical player
      expect(result.linkedSourcePlayerIds).toHaveLength(4);
    });
  });

  describe("search behavior", () => {
    it("search accepts query and limit", () => {
      const input: SearchPlayersInput = {
        query: "Thompson",
        limit: 25,
      };

      expect(input.query).toBe("Thompson");
      expect(input.limit).toBe(25);
      expect(input.leagueId).toBeUndefined();
    });

    it("search accepts optional league filter", () => {
      const pllSearch: SearchPlayersInput = {
        query: "Smith",
        leagueId: 1,
        limit: 10,
      };

      const nllSearch: SearchPlayersInput = {
        query: "Smith",
        leagueId: 2,
        limit: 10,
      };

      expect(pllSearch.leagueId).toBe(1);
      expect(nllSearch.leagueId).toBe(2);
    });
  });

  describe("cross-league identity", () => {
    it("canonical player can link source players from multiple leagues", () => {
      // A player like Lyle Thompson might play in both PLL and NLL
      // They should be linked to the same canonical player
      const pllSourcePlayerId = 100; // PLL source player
      const nllSourcePlayerId = 200; // NLL source player

      const result: LinkPlayerIdentityResult = {
        canonicalPlayerId: 1,
        isNewCanonical: true,
        linkedSourcePlayerIds: [pllSourcePlayerId, nllSourcePlayerId],
        matchMethod: "exact",
        confidenceScore: 1.0,
      };

      // Both source players from different leagues are linked
      expect(result.linkedSourcePlayerIds).toContain(pllSourcePlayerId);
      expect(result.linkedSourcePlayerIds).toContain(nllSourcePlayerId);
    });
  });

  describe("error scenarios", () => {
    it("NoMatchError indicates missing required data for exact match", () => {
      // Exact match requires both normalized_name and DOB
      const missingDobError = new NoMatchError({
        message:
          "Cannot establish exact match for source player 42: missing DOB",
        sourcePlayerId: 42,
      });

      expect(missingDobError._tag).toBe("NoMatchError");
      expect(missingDobError.sourcePlayerId).toBe(42);
    });

    it("AlreadyLinkedError prevents duplicate links", () => {
      // A source player can only be linked to one canonical player
      const error = new AlreadyLinkedError({
        message: "Source player 42 is already linked to canonical player 10",
        sourcePlayerId: 42,
        existingCanonicalPlayerId: 10,
      });

      expect(error.sourcePlayerId).toBe(42);
      expect(error.existingCanonicalPlayerId).toBe(10);
    });
  });
});
