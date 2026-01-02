import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  PLLAdvancedPlayersRequest,
  PLLCareerStatsRequest,
  PLLEventsRequest,
  PLLPlayerDetailRequest,
  PLLPlayersRequest,
  PLLStandingsRequest,
  PLLStatLeadersRequest,
  PLLTeamDetailRequest,
  PLLTeamStatsRequest,
  PLLTeamsRequest,
  PLLTeamStanding,
  PLLPlayer,
  PLLPlayerStats,
  PLLPlayerTeam,
  PLLStatLeader,
  PLLTeam,
  PLLTeamStats,
  PLLCareerStat,
  PLLEvent,
} from "./pll.schema";

describe("PLLStandingsRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = { year: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLStandingsRequest)(input),
    );
    expect(result.year).toBe(2024);
    expect(result.champSeries).toBe(false);
  });

  it("decodes request with champSeries true", async () => {
    const input = { year: 2024, champSeries: true };
    const result = await Effect.runPromise(
      Schema.decode(PLLStandingsRequest)(input),
    );
    expect(result.champSeries).toBe(true);
  });

  it("rejects year before 2019", async () => {
    const input = { year: 2018 };
    await expect(
      Effect.runPromise(Schema.decode(PLLStandingsRequest)(input)),
    ).rejects.toThrow();
  });

  it("rejects year after 2035", async () => {
    const input = { year: 2036 };
    await expect(
      Effect.runPromise(Schema.decode(PLLStandingsRequest)(input)),
    ).rejects.toThrow();
  });
});

describe("PLLPlayersRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = { season: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLPlayersRequest)(input),
    );
    expect(result.season).toBe(2024);
    expect(result.league).toBe("PLL");
    expect(result.includeZPP).toBe(false);
    expect(result.includeReg).toBe(true);
    expect(result.includePost).toBe(false);
  });

  it("decodes request with all options", async () => {
    const input = {
      season: 2024,
      league: "WLL",
      includeZPP: true,
      includeReg: false,
      includePost: true,
      limit: 50,
    };
    const result = await Effect.runPromise(
      Schema.decode(PLLPlayersRequest)(input),
    );
    expect(result.league).toBe("WLL");
    expect(result.includeZPP).toBe(true);
    expect(result.limit).toBe(50);
  });

  it("rejects negative limit", async () => {
    const input = { season: 2024, limit: -1 };
    await expect(
      Effect.runPromise(Schema.decode(PLLPlayersRequest)(input)),
    ).rejects.toThrow();
  });

  it("rejects limit over 1000", async () => {
    const input = { season: 2024, limit: 1001 };
    await expect(
      Effect.runPromise(Schema.decode(PLLPlayersRequest)(input)),
    ).rejects.toThrow();
  });
});

describe("PLLStatLeadersRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = { year: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLStatLeadersRequest)(input),
    );
    expect(result.year).toBe(2024);
    expect(result.seasonSegment).toBe("regular");
  });

  it("accepts post segment", async () => {
    const input = { year: 2024, seasonSegment: "post" as const };
    const result = await Effect.runPromise(
      Schema.decode(PLLStatLeadersRequest)(input),
    );
    expect(result.seasonSegment).toBe("post");
  });
});

describe("PLLAdvancedPlayersRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = { year: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLAdvancedPlayersRequest)(input),
    );
    expect(result.year).toBe(2024);
    expect(result.limit).toBe(250);
    expect(result.league).toBe("PLL");
  });

  it("accepts custom limit", async () => {
    const input = { year: 2024, limit: 100 };
    const result = await Effect.runPromise(
      Schema.decode(PLLAdvancedPlayersRequest)(input),
    );
    expect(result.limit).toBe(100);
  });
});

describe("PLLTeamsRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = { year: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLTeamsRequest)(input),
    );
    expect(result.year).toBe(2024);
    expect(result.includeChampSeries).toBe(false);
  });

  it("accepts includeChampSeries", async () => {
    const input = { year: 2024, includeChampSeries: true };
    const result = await Effect.runPromise(
      Schema.decode(PLLTeamsRequest)(input),
    );
    expect(result.includeChampSeries).toBe(true);
  });
});

describe("PLLCareerStatsRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = {};
    const result = await Effect.runPromise(
      Schema.decode(PLLCareerStatsRequest)(input),
    );
    // limit is optional without a default in the schema
    // (default of 25 is applied at client/query level)
    expect(result.limit).toBeUndefined();
  });

  it("accepts stat filter", async () => {
    const input = { stat: "goals", limit: 50 };
    const result = await Effect.runPromise(
      Schema.decode(PLLCareerStatsRequest)(input),
    );
    expect(result.stat).toBe("goals");
    expect(result.limit).toBe(50);
  });
});

describe("PLLPlayerDetailRequest", () => {
  it("decodes valid request", async () => {
    const input = { slug: "liam-byrnes", statsYear: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLPlayerDetailRequest)(input),
    );
    expect(result.slug).toBe("liam-byrnes");
    expect(result.statsYear).toBe(2024);
  });

  it("requires slug", async () => {
    const input = { statsYear: 2024 };
    await expect(
      Effect.runPromise(Schema.decode(PLLPlayerDetailRequest)(input as any)),
    ).rejects.toThrow();
  });
});

describe("PLLTeamDetailRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = { id: "ARC", year: 2024, statsYear: 2024, eventsYear: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLTeamDetailRequest)(input),
    );
    expect(result.id).toBe("ARC");
    expect(result.includeChampSeries).toBe(false);
  });
});

describe("PLLTeamStatsRequest", () => {
  it("decodes valid request", async () => {
    const input = { id: "ARC", year: 2024, segment: "regular" as const };
    const result = await Effect.runPromise(
      Schema.decode(PLLTeamStatsRequest)(input),
    );
    expect(result.segment).toBe("regular");
  });

  it("accepts post segment", async () => {
    const input = { id: "ARC", year: 2024, segment: "post" as const };
    const result = await Effect.runPromise(
      Schema.decode(PLLTeamStatsRequest)(input),
    );
    expect(result.segment).toBe("post");
  });
});

describe("PLLEventsRequest", () => {
  it("decodes valid request with defaults", async () => {
    const input = { year: 2024 };
    const result = await Effect.runPromise(
      Schema.decode(PLLEventsRequest)(input),
    );
    expect(result.year).toBe(2024);
    expect(result.includeCS).toBe(true);
    expect(result.includeWLL).toBe(true);
  });
});

describe("Response schemas", () => {
  describe("PLLTeamStanding", () => {
    it("decodes valid standing", async () => {
      const input = {
        teamId: "ARC",
        fullName: "Archers LC",
        location: "Utah",
        locationCode: "ARC",
        urlLogo: "https://example.com/logo.png",
        seed: 1,
        wins: 10,
        losses: 2,
        ties: 0,
        scores: 150,
        scoresAgainst: 100,
        scoreDiff: 50,
        conferenceWins: 5,
        conferenceLosses: 1,
        conferenceTies: 0,
        conferenceScores: 75,
        conferenceScoresAgainst: 50,
        conference: "East",
        conferenceSeed: 1,
      };
      const result = await Effect.runPromise(
        Schema.decode(PLLTeamStanding)(input),
      );
      expect(result.teamId).toBe("ARC");
      expect(result.wins).toBe(10);
    });

    it("accepts null for optional fields", async () => {
      const input = {
        teamId: "ARC",
        fullName: "Archers LC",
        location: null,
        locationCode: null,
        urlLogo: "https://example.com/logo.png",
        seed: null,
        wins: 10,
        losses: 2,
        ties: 0,
        scores: 150,
        scoresAgainst: 100,
        scoreDiff: 50,
        conferenceWins: 5,
        conferenceLosses: 1,
        conferenceTies: 0,
        conferenceScores: 75,
        conferenceScoresAgainst: 50,
        conference: null,
        conferenceSeed: null,
      };
      const result = await Effect.runPromise(
        Schema.decode(PLLTeamStanding)(input),
      );
      expect(result.location).toBeNull();
      expect(result.seed).toBeNull();
    });
  });

  describe("PLLPlayerStats", () => {
    it("decodes valid stats", async () => {
      const input = {
        gamesPlayed: 10,
        goals: 5,
        twoPointGoals: 2,
        assists: 3,
        points: 10,
        scoringPoints: 12,
        shots: 20,
        shotPct: 25,
        shotsOnGoal: 15,
        shotsOnGoalPct: 75,
        twoPointShots: 5,
        twoPointShotPct: 40,
        groundBalls: 8,
        turnovers: 3,
        causedTurnovers: 2,
        faceoffsWon: 0,
        faceoffsLost: 0,
        faceoffs: 0,
        faceoffPct: 0,
        saves: 0,
        savePct: 0,
        goalsAgainst: 0,
        GAA: 0,
        plusMinus: 5,
      };
      const result = await Effect.runPromise(
        Schema.decode(PLLPlayerStats)(input),
      );
      expect(result.goals).toBe(5);
      expect(result.plusMinus).toBe(5);
    });
  });

  describe("PLLPlayerTeam", () => {
    it("decodes valid team", async () => {
      const input = {
        officialId: "ARC",
        location: "Utah",
        locationCode: "ARC",
        urlLogo: "https://example.com/logo.png",
        league: "PLL",
        position: "A",
        positionName: "Attack",
        jerseyNum: 22,
        year: 2024,
        fullName: "Archers LC",
      };
      const result = await Effect.runPromise(
        Schema.decode(PLLPlayerTeam)(input),
      );
      expect(result.officialId).toBe("ARC");
      expect(result.year).toBe(2024);
    });
  });

  describe("PLLStatLeader", () => {
    it("decodes valid stat leader", async () => {
      const input = {
        officialId: "000365",
        profileUrl: "https://example.com/player",
        firstName: "Lyle",
        lastName: "Thompson",
        position: "A",
        statType: "goals",
        slug: "lyle-thompson",
        statValue: "50",
        playerRank: 1,
        jerseyNum: "4",
        teamId: "CAN",
        year: 2024,
      };
      const result = await Effect.runPromise(
        Schema.decode(PLLStatLeader)(input),
      );
      expect(result.statValue).toBe(50);
      expect(result.playerRank).toBe(1);
    });
  });

  describe("PLLTeamStats", () => {
    it("decodes valid team stats", async () => {
      const input = {
        gamesPlayed: 12,
        goals: 150,
        twoPointGoals: 30,
        assists: 100,
        shots: 400,
        twoPointShots: 80,
        groundBalls: 200,
        turnovers: 100,
        causedTurnovers: 90,
        faceoffsWon: 150,
        faceoffsLost: 140,
        faceoffs: 290,
        faceoffPct: 51.7,
        shotPct: 37.5,
        twoPointShotPct: 37.5,
        shotsOnGoal: 300,
        shotsOnGoalPct: 75,
        twoPointShotsOnGoal: 60,
        twoPointShotsOnGoalPct: 75,
        goalsAgainst: 120,
        twoPointGoalsAgainst: 25,
        saves: 180,
        savePct: 60,
        clearPct: 90,
        ridesPct: 30,
        shortHandedPct: 80,
        shortHandedGoalsAgainstPct: 20,
        powerPlayPct: 40,
        powerPlayGoalsAgainstPct: 30,
        manDownPct: 70,
        numPenalties: 50,
        pim: 100,
        clears: 180,
        clearAttempts: 200,
        rides: 60,
        rideAttempts: 200,
        offsides: 5,
        shotClockExpirations: 3,
        powerPlayGoals: 20,
        powerPlayShots: 50,
        shortHandedGoals: 5,
        shortHandedShots: 20,
        shortHandedShotsAgainst: 15,
        shortHandedGoalsAgainst: 3,
        powerPlayGoalsAgainst: 10,
        powerPlayShotsAgainst: 40,
        timesManUp: 50,
        timesShortHanded: 45,
        scores: 180,
        onePointGoals: 120,
        scoresAgainst: 145,
        saa: 12.1,
        scoresPG: 15,
        shotsPG: 33.3,
        totalPasses: 2000,
        touches: 3000,
      };
      const result = await Effect.runPromise(
        Schema.decode(PLLTeamStats)(input),
      );
      expect(result.gamesPlayed).toBe(12);
      expect(result.faceoffPct).toBe(51.7);
    });
  });

  describe("PLLCareerStat", () => {
    it("decodes valid career stat", async () => {
      const input = {
        player: {
          name: "Lyle Thompson",
          experience: 5,
          allYears: [2019, 2020, 2021, 2022, 2023],
          slug: "lyle-thompson",
        },
        gamesPlayed: 60,
        points: 200,
        goals: 120,
        onePointGoals: 90,
        twoPointGoals: 30,
        assists: 80,
        groundBalls: 50,
        saves: 0,
        faceoffsWon: 0,
      };
      const result = await Effect.runPromise(
        Schema.decode(PLLCareerStat)(input),
      );
      expect(result.player.name).toBe("Lyle Thompson");
      expect(result.goals).toBe(120);
    });
  });

  describe("PLLEvent", () => {
    it("decodes valid event", async () => {
      const input = {
        id: 123,
        slugname: "week-1-2024",
        eventId: "evt-123",
        externalId: null,
        league: "PLL",
        seasonSegment: "regular",
        startTime: "2024-06-01T14:00:00Z",
        week: "1",
        year: 2024,
        gameNumber: 1,
        location: "City, State",
        venue: "Stadium",
        venueLocation: "City, State",
        urlStreaming: null,
        urlTicket: "https://tickets.example.com",
        urlPreview: null,
        broadcaster: ["ESPN"],
        addToCalendarId: null,
        description: "Opening week",
        weekendTicketId: null,
        suiteId: null,
        waitlistUrl: null,
        waitlist: null,
        eventStatus: 1,
        period: null,
        clockMinutes: null,
        clockSeconds: null,
        clockTenths: null,
        gameStatus: null,
        externalEventId: null,
        visitorScore: null,
        homeScore: null,
        homeTeam: null,
        awayTeam: null,
        ticketId: null,
        snl: null,
      };
      const result = await Effect.runPromise(Schema.decode(PLLEvent)(input));
      expect(result.id).toBe(123);
      expect(result.year).toBe(2024);
    });
  });
});
