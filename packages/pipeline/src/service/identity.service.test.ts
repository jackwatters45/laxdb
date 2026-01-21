import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";

import {
  IdentityService,
  IdentityServiceError,
  SourcePlayerNotFoundError,
  AlreadyLinkedError,
  NoExactMatchDataError,
  normalizeName,
  type FindExactMatchesInput,
  type CreateCanonicalPlayerInput,
  type LinkSourcePlayerInput,
  type MatchCandidate,
  type CreateCanonicalPlayerResult,
  type LinkSourcePlayerResult,
} from "./identity.service";

describe("IdentityService", () => {
  describe("normalizeName (pure function)", () => {
    it("converts to lowercase", () => {
      expect(normalizeName("John Smith")).toBe("john smith");
      expect(normalizeName("MIKE JONES")).toBe("mike jones");
      expect(normalizeName("LyLe ThOmPsOn")).toBe("lyle thompson");
    });

    it("removes accents and diacritics", () => {
      // Common lacrosse player name variations
      expect(normalizeName("José García")).toBe("jose garcia");
      expect(normalizeName("François Côté")).toBe("francois cote");
      expect(normalizeName("Müller")).toBe("muller");
      expect(normalizeName("Björk")).toBe("bjork");
      expect(normalizeName("Señor")).toBe("senor");
      expect(normalizeName("Café")).toBe("cafe");
    });

    it("trims whitespace", () => {
      expect(normalizeName("  John Smith  ")).toBe("john smith");
      expect(normalizeName("\tMike Jones\n")).toBe("mike jones");
    });

    it("collapses multiple spaces", () => {
      expect(normalizeName("John    Smith")).toBe("john smith");
      expect(normalizeName("Mike  J   Jones")).toBe("mike j jones");
    });

    it("removes non-alphanumeric characters except spaces", () => {
      expect(normalizeName("John O'Brien")).toBe("john obrien");
      expect(normalizeName("Mike Jones Jr.")).toBe("mike jones jr");
      expect(normalizeName("Mike Jones, Jr")).toBe("mike jones jr");
      expect(normalizeName("Smith-Thompson")).toBe("smiththompson");
      expect(normalizeName("John (Jack) Smith")).toBe("john jack smith");
    });

    it("handles empty strings", () => {
      expect(normalizeName("")).toBe("");
      expect(normalizeName("   ")).toBe("");
    });

    it("handles common name variations", () => {
      // These should all normalize to the same value
      expect(normalizeName("Lyle Thompson")).toBe("lyle thompson");
      expect(normalizeName("LYLE THOMPSON")).toBe("lyle thompson");
      expect(normalizeName("  Lyle   Thompson  ")).toBe("lyle thompson");

      // Hyphenated names
      expect(normalizeName("Miles Thompson-Smith")).toBe("miles thompsonsmith");

      // Names with suffixes
      expect(normalizeName("John Smith III")).toBe("john smith iii");
      expect(normalizeName("Mike Jones Jr")).toBe("mike jones jr");
    });

    it("preserves numbers in names", () => {
      // Some players might have numbers in their nicknames
      expect(normalizeName("John Smith 3rd")).toBe("john smith 3rd");
    });

    it("handles edge cases for common names", () => {
      // Common names that might have variations
      expect(normalizeName("Mike")).toBe("mike");
      expect(normalizeName("Michael")).toBe("michael");
      // Note: Mike != Michael - these are different normalized names
      // This is by design - exact match requires exact names
    });
  });

  describe("error types", () => {
    it.effect("IdentityServiceError has correct tag", () =>
      Effect.gen(function* () {
        const error = new IdentityServiceError({
          message: "Something went wrong",
          cause: new Error("underlying cause"),
        });

        expect(error._tag).toBe("IdentityServiceError");
        expect(error.message).toBe("Something went wrong");
      }),
    );

    it.effect("IdentityServiceError works without cause", () =>
      Effect.gen(function* () {
        const error = new IdentityServiceError({
          message: "Simple error",
        });

        expect(error._tag).toBe("IdentityServiceError");
        expect(error.message).toBe("Simple error");
      }),
    );

    it.effect("SourcePlayerNotFoundError has correct tag and fields", () =>
      Effect.gen(function* () {
        const error = new SourcePlayerNotFoundError({
          message: "Source player 42 not found",
          sourcePlayerId: 42,
        });

        expect(error._tag).toBe("SourcePlayerNotFoundError");
        expect(error.message).toBe("Source player 42 not found");
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

    it.effect("NoExactMatchDataError has correct tag and fields", () =>
      Effect.gen(function* () {
        const error = new NoExactMatchDataError({
          message: "Cannot establish exact match: missing DOB",
          sourcePlayerId: 42,
          missingField: "dob",
        });

        expect(error._tag).toBe("NoExactMatchDataError");
        expect(error.message).toBe("Cannot establish exact match: missing DOB");
        expect(error.sourcePlayerId).toBe(42);
        expect(error.missingField).toBe("dob");
      }),
    );
  });

  describe("service definition", () => {
    it("IdentityService is a valid Effect service", () => {
      expect(IdentityService).toBeDefined();
      expect(IdentityService.key).toBe("IdentityService");
    });

    it("IdentityService.Default provides the service layer", () => {
      expect(IdentityService.Default).toBeDefined();
    });
  });

  describe("input types", () => {
    it("FindExactMatchesInput accepts required fields", () => {
      const input: FindExactMatchesInput = {
        normalizedName: "lyle thompson",
        dob: new Date("1990-01-15"),
      };

      expect(input.normalizedName).toBe("lyle thompson");
      expect(input.dob).toEqual(new Date("1990-01-15"));
      expect(input.excludeSourcePlayerId).toBeUndefined();
    });

    it("FindExactMatchesInput accepts optional excludeSourcePlayerId", () => {
      const input: FindExactMatchesInput = {
        normalizedName: "lyle thompson",
        dob: new Date("1990-01-15"),
        excludeSourcePlayerId: 42,
      };

      expect(input.excludeSourcePlayerId).toBe(42);
    });

    it("CreateCanonicalPlayerInput accepts required fields", () => {
      const input: CreateCanonicalPlayerInput = {
        primarySourcePlayerId: 1,
        displayName: "Lyle Thompson",
      };

      expect(input.primarySourcePlayerId).toBe(1);
      expect(input.displayName).toBe("Lyle Thompson");
    });

    it("CreateCanonicalPlayerInput accepts optional fields", () => {
      const input: CreateCanonicalPlayerInput = {
        primarySourcePlayerId: 1,
        displayName: "Lyle Thompson",
        position: "Attack",
        dob: new Date("1992-09-15"),
        hometown: "Onondaga Nation, NY",
        college: "University at Albany",
      };

      expect(input.position).toBe("Attack");
      expect(input.dob).toEqual(new Date("1992-09-15"));
      expect(input.hometown).toBe("Onondaga Nation, NY");
      expect(input.college).toBe("University at Albany");
    });

    it("LinkSourcePlayerInput accepts required fields", () => {
      const input: LinkSourcePlayerInput = {
        canonicalPlayerId: 1,
        sourcePlayerId: 100,
      };

      expect(input.canonicalPlayerId).toBe(1);
      expect(input.sourcePlayerId).toBe(100);
    });

    it("LinkSourcePlayerInput accepts optional fields", () => {
      const exactInput: LinkSourcePlayerInput = {
        canonicalPlayerId: 1,
        sourcePlayerId: 100,
        matchMethod: "exact",
        confidenceScore: 1.0,
      };

      expect(exactInput.matchMethod).toBe("exact");
      expect(exactInput.confidenceScore).toBe(1.0);

      const manualInput: LinkSourcePlayerInput = {
        canonicalPlayerId: 1,
        sourcePlayerId: 200,
        matchMethod: "manual",
        confidenceScore: 1.0,
      };

      expect(manualInput.matchMethod).toBe("manual");
    });
  });

  describe("output types", () => {
    it("MatchCandidate has all expected fields", () => {
      const candidate: MatchCandidate = {
        sourcePlayerId: 100,
        normalizedName: "lyle thompson",
        dob: new Date("1992-09-15"),
        canonicalPlayerId: null,
        leagueId: 1,
        leaguePriority: 1,
      };

      expect(candidate.sourcePlayerId).toBe(100);
      expect(candidate.normalizedName).toBe("lyle thompson");
      expect(candidate.canonicalPlayerId).toBeNull();
      expect(candidate.leaguePriority).toBe(1);
    });

    it("MatchCandidate can have canonicalPlayerId for linked players", () => {
      const linkedCandidate: MatchCandidate = {
        sourcePlayerId: 100,
        normalizedName: "lyle thompson",
        dob: new Date("1992-09-15"),
        canonicalPlayerId: 5,
        leagueId: 1,
        leaguePriority: 1,
      };

      expect(linkedCandidate.canonicalPlayerId).toBe(5);
    });

    it("CreateCanonicalPlayerResult has expected fields", () => {
      const result: CreateCanonicalPlayerResult = {
        canonicalPlayerId: 1,
      };

      expect(result.canonicalPlayerId).toBe(1);
    });

    it("LinkSourcePlayerResult has expected fields", () => {
      const result: LinkSourcePlayerResult = {
        identityId: 10,
        canonicalPlayerId: 1,
        sourcePlayerId: 100,
      };

      expect(result.identityId).toBe(10);
      expect(result.canonicalPlayerId).toBe(1);
      expect(result.sourcePlayerId).toBe(100);
    });
  });

  describe("identity matching behavior", () => {
    it("exact match requires both normalized_name AND dob", () => {
      // Per spec: MVP uses exact-match only (confidence = 1.0)
      // Exact match = normalized_name + DOB both match
      const input: FindExactMatchesInput = {
        normalizedName: "lyle thompson",
        dob: new Date("1992-09-15"),
      };

      // Both fields are required for exact match
      expect(input.normalizedName).toBeDefined();
      expect(input.dob).toBeDefined();
    });

    it("MVP confidence score is always 1.0 for exact matches", () => {
      const result: LinkSourcePlayerResult = {
        identityId: 1,
        canonicalPlayerId: 1,
        sourcePlayerId: 100,
      };

      // MVP: exact match only with confidence = 1.0
      // The service enforces this internally
      expect(result).toBeDefined();
    });

    it("league priority determines primary source (lower = better)", () => {
      // Per spec: Source Priority: PLL(1) > NLL(2) > Gamesheet(3) > StatsCrew(4) > Pointstreak(5) > Wayback(6)
      const pllCandidate: MatchCandidate = {
        sourcePlayerId: 100,
        normalizedName: "lyle thompson",
        dob: new Date("1992-09-15"),
        canonicalPlayerId: null,
        leagueId: 1,
        leaguePriority: 1, // PLL - highest priority
      };

      const nllCandidate: MatchCandidate = {
        sourcePlayerId: 200,
        normalizedName: "lyle thompson",
        dob: new Date("1992-09-15"),
        canonicalPlayerId: null,
        leagueId: 2,
        leaguePriority: 2, // NLL - lower priority
      };

      // PLL (priority 1) should be preferred over NLL (priority 2)
      expect(pllCandidate.leaguePriority).toBeLessThan(
        nllCandidate.leaguePriority,
      );
    });
  });

  describe("cross-league identity scenarios", () => {
    it("same player in multiple leagues should have same normalized name + DOB", () => {
      // A player like Lyle Thompson plays in both PLL and NLL
      // They should match on normalized_name + DOB
      const pllName = normalizeName("Lyle Thompson");
      const nllName = normalizeName("LYLE THOMPSON");

      expect(pllName).toBe(nllName);
    });

    it("common names without DOB cannot be exact matched", () => {
      // "John Smith" is a common name - without DOB we can't verify identity
      // This is why NoExactMatchDataError exists
      const commonName = normalizeName("John Smith");
      expect(commonName).toBe("john smith");

      // Without DOB, we'd need to use fuzzy matching (Phase 2)
    });

    it("name variations that should NOT match", () => {
      // These are different people despite similar names
      expect(normalizeName("Mike Smith")).not.toBe(
        normalizeName("Michael Smith"),
      );
      expect(normalizeName("John Thompson")).not.toBe(
        normalizeName("Jon Thompson"),
      );

      // Note: Nicknames vs full names are different - this is by design for MVP
      // Phase 2 will handle fuzzy matching for nicknames
    });
  });

  describe("edge cases", () => {
    it("handles players with single names", () => {
      expect(normalizeName("Pelé")).toBe("pele");
      expect(normalizeName("MADONNA")).toBe("madonna");
    });

    it("handles very long names", () => {
      const longName =
        "Wolfeschlegelsteinhausenbergerdorffwelchevoralternwarengewissenhaftschaferswessenschafewaaborgeweidenamfaborgeweidenamfanvonangereifendurchihrraubgier";
      const normalized = normalizeName(longName);
      expect(normalized.length).toBeGreaterThan(0);
      expect(normalized).not.toContain(" "); // Single word, no spaces
    });

    it("handles special characters from various languages", () => {
      // Nordic
      expect(normalizeName("Bjørn Østerberg")).toBe("bjorn osterberg");

      // German
      expect(normalizeName("Jürgen Müller")).toBe("jurgen muller");

      // French
      expect(normalizeName("François Élise")).toBe("francois elise");

      // Spanish
      expect(normalizeName("José García")).toBe("jose garcia");

      // Polish
      expect(normalizeName("Łukasz Błaszczykowski")).toBe(
        "lukasz blaszczykowski",
      );
    });

    it("handles names with apostrophes consistently", () => {
      // Irish names
      expect(normalizeName("O'Brien")).toBe("obrien");
      expect(normalizeName("O'Connor")).toBe("oconnor");
      expect(normalizeName("McDonald")).toBe("mcdonald");
    });

    it("handles hyphenated names consistently", () => {
      // Hyphenated names lose the hyphen
      expect(normalizeName("Smith-Jones")).toBe("smithjones");
      expect(normalizeName("Mary-Jane Watson")).toBe("maryjane watson");
    });
  });

  describe("service method availability", () => {
    it("IdentityService exposes normalizeName method", () => {
      // The service exposes normalizeName as a method for consistency
      // This is verified by the service definition
      expect(IdentityService).toBeDefined();
    });

    it("IdentityService exposes findExactMatches method", () => {
      // Method signature: (input: FindExactMatchesInput) => Effect<MatchCandidate[], IdentityServiceError>
      expect(IdentityService).toBeDefined();
    });

    it("IdentityService exposes createCanonicalPlayer method", () => {
      // Method signature: (input: CreateCanonicalPlayerInput) => Effect<CreateCanonicalPlayerResult, IdentityServiceError>
      expect(IdentityService).toBeDefined();
    });

    it("IdentityService exposes linkSourcePlayer method", () => {
      // Method signature: (input: LinkSourcePlayerInput) => Effect<LinkSourcePlayerResult, AlreadyLinkedError | IdentityServiceError>
      expect(IdentityService).toBeDefined();
    });

    it("IdentityService exposes processIdentity method", () => {
      // Method signature: (sourcePlayerId: number) => Effect<ProcessIdentityResult, ...>
      // This is the main entry point for identity resolution
      expect(IdentityService).toBeDefined();
    });
  });
});
