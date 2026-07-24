import { describe, expect, it } from "@effect/vitest";
import { organizations, users } from "@laxdb/core/auth/auth.sql";
import { ClubRepo } from "@laxdb/core/club/club.repo";
import { clubTeams, rosterPlayers } from "@laxdb/core/club/club.sql";
import { DrizzleService, query } from "@laxdb/core/drizzle/drizzle.service";
import {
  GamedayClient,
  GamedayLadder,
  GamedayLadderRow,
} from "@laxdb/core/match/gameday";
import { GamedayRepo } from "@laxdb/core/match/gameday.repo";
import {
  clubTeamGamedayLinks,
  gamedayCompetitions,
  gamedayLadderRows,
  gamedayRosterEntries,
  gamedaySources,
  rosterPlayerGamedayLinks,
} from "@laxdb/core/match/gameday.sql";
import { MatchRepo } from "@laxdb/core/match/match.repo";
import { fixtures } from "@laxdb/core/match/match.sql";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { TestDatabaseLive, truncateAll } from "../test/db";
import { makeTestRunner } from "../test/effect";

import { StatsRepo } from "./stats.repo";
import { StatsService } from "./stats.service";

const ORG_ID = "stats-org";
const OTHER_ORG_ID = "stats-other-org";
const USER_ID = "stats-user";
const TEAM_ID = "stats-team";
const OTHER_TEAM_ID = "stats-other-team";
const PLAYER_ID = "stats-player";
const OTHER_PLAYER_ID = "stats-other-player";
const FIXTURE_ID = "stats-fixture";
const SECOND_FIXTURE_ID = "stats-fixture-away";
const MISSING_SCORE_FIXTURE_ID = "stats-fixture-missing-score";

const TestGamedayLive = Layer.succeed(GamedayClient, {
  fetchLadder: () =>
    Effect.succeed(
      new GamedayLadder({
        sourceUploadedAt: "Thu 23-Jul-2026 14:03:47",
        rows: [
          new GamedayLadderRow({
            position: 3,
            teamId: "gameday-malvern",
            teamName: "Malvern/MCC",
            played: 10,
            wins: 5,
            losses: 5,
            draws: 0,
            byes: 0,
            forfeitsFor: 0,
            forfeitsGiven: 0,
            goalsFor: 100,
            goalsAgainst: 90,
            goalDifference: 10,
            percentage: 111.11,
            premiershipPoints: 20,
          }),
        ],
      }),
    ),
  fetchSeasons: () => Effect.die("GameDay seasons should not be called"),
  fetchCompetitions: () =>
    Effect.die("GameDay competitions should not be called"),
  fetchFixtures: () => Effect.die("GameDay fixtures should not be called"),
  fetchTeams: () => Effect.die("GameDay teams should not be called"),
  fetchRoster: () => Effect.die("GameDay roster should not be called"),
  fetchClubs: () => Effect.die("GameDay clubs should not be called"),
  fetchCompetitionsForClubs: () =>
    Effect.die("GameDay club competitions should not be called"),
});

const DependenciesLive = Layer.mergeAll(
  StatsRepo.layer,
  MatchRepo.layer,
  ClubRepo.layer,
  GamedayRepo.layer,
  TestGamedayLive,
).pipe(Layer.provide(TestDatabaseLive));
const StatsServiceLive = Layer.effect(StatsService, StatsService.make).pipe(
  Layer.provide(DependenciesLive),
);
const TestLayer = Layer.mergeAll(StatsServiceLive, TestDatabaseLive);
const run = makeTestRunner(TestLayer);

const seedStats = Effect.gen(function* () {
  const db = yield* DrizzleService;
  yield* query(
    db.insert(users).values({
      id: USER_ID,
      name: "Stats Admin",
      email: "stats@example.com",
      emailVerified: true,
    }),
  );
  yield* query(
    db.insert(organizations).values([
      {
        id: ORG_ID,
        name: "Stats Club",
        slug: "stats-club",
      },
      {
        id: OTHER_ORG_ID,
        name: "Other Stats Club",
        slug: "other-stats-club",
      },
    ]),
  );
  yield* query(
    db.insert(clubTeams).values([
      { id: TEAM_ID, organizationId: ORG_ID, name: "U14 Boys" },
      { id: OTHER_TEAM_ID, organizationId: ORG_ID, name: "U16 Boys" },
    ]),
  );
  yield* query(
    db.insert(rosterPlayers).values([
      {
        id: PLAYER_ID,
        organizationId: ORG_ID,
        teamId: TEAM_ID,
        name: "A Player",
        jerseyNumber: 7,
        active: true,
      },
      {
        id: OTHER_PLAYER_ID,
        organizationId: ORG_ID,
        teamId: OTHER_TEAM_ID,
        name: "Other Player",
        jerseyNumber: 9,
        active: true,
      },
    ]),
  );
  yield* query(
    db.insert(gamedaySources).values({
      id: "lacrosse-victoria",
      name: "Lacrosse Victoria",
      clientId: "0-1064-0-0-0",
      baseUrl: "https://websites.mygameday.app",
    }),
  );
  yield* query(
    db.insert(gamedayCompetitions).values({
      id: "competition-row",
      sourceId: "lacrosse-victoria",
      seasonId: "season-2026",
      compId: "comp-u14",
      name: "U14 Boys",
    }),
  );
  yield* query(
    db.insert(clubTeamGamedayLinks).values({
      id: "team-link",
      organizationId: ORG_ID,
      clubTeamId: TEAM_ID,
      sourceId: "lacrosse-victoria",
      seasonId: "season-2026",
      compId: "comp-u14",
      gamedayTeamId: "gameday-malvern",
    }),
  );
  yield* query(
    db.insert(fixtures).values([
      {
        id: FIXTURE_ID,
        organizationId: ORG_ID,
        teamId: TEAM_ID,
        gamedayFixtureId: "game-1",
        sourceId: "lacrosse-victoria",
        seasonId: "season-2026",
        compId: "comp-u14",
        homeTeamName: "Malvern/MCC",
        awayTeamName: "Visitors",
        isHome: true,
        homeScore: 9,
        awayScore: 6,
      },
      {
        id: SECOND_FIXTURE_ID,
        organizationId: ORG_ID,
        teamId: TEAM_ID,
        gamedayFixtureId: "game-2",
        sourceId: "lacrosse-victoria",
        seasonId: "season-2026",
        compId: "comp-u14",
        homeTeamName: "Visitors",
        awayTeamName: "Malvern/MCC",
        isHome: false,
        homeScore: 5,
        awayScore: 8,
      },
      {
        id: MISSING_SCORE_FIXTURE_ID,
        organizationId: ORG_ID,
        teamId: TEAM_ID,
        gamedayFixtureId: "game-missing-score",
        sourceId: "lacrosse-victoria",
        seasonId: "season-2026",
        compId: "comp-u14",
        scheduledAt: new Date("2026-06-01T10:00:00Z"),
        homeTeamName: "Malvern/MCC",
        awayTeamName: "Missing Result",
        isHome: true,
        homeScore: null,
        awayScore: null,
      },
      {
        id: "old-season-fixture",
        organizationId: ORG_ID,
        teamId: TEAM_ID,
        gamedayFixtureId: "game-old",
        sourceId: "lacrosse-victoria",
        seasonId: "season-2025",
        compId: "comp-old",
        homeTeamName: "Malvern/MCC",
        awayTeamName: "Old Visitors",
        isHome: true,
        homeScore: 100,
        awayScore: 0,
      },
    ]),
  );
  yield* query(
    db.insert(gamedayLadderRows).values({
      id: "ladder-malvern",
      sourceId: "lacrosse-victoria",
      seasonId: "season-2026",
      compId: "comp-u14",
      position: 3,
      gamedayTeamId: "gameday-malvern",
      teamName: "Malvern/MCC",
      played: 10,
      wins: 5,
      losses: 5,
      draws: 0,
      byes: 0,
      forfeitsFor: 0,
      forfeitsGiven: 0,
      goalsFor: 92,
      goalsAgainst: 83,
      goalDifference: 9,
      percentage: 110.84,
      premiershipPoints: 20,
      sourceUploadedAt: "Thu 23-Jul-2026 14:03:47",
      fetchedAt: new Date("2026-07-23T04:03:47Z"),
    }),
  );
  yield* query(
    db.insert(gamedayRosterEntries).values({
      id: "gameday-roster-entry",
      sourceId: "lacrosse-victoria",
      seasonId: "season-2026",
      compId: "comp-u14",
      teamId: "gameday-malvern",
      playerId: "gameday-player",
      playerName: "A Player",
      gamesPlayed: 10,
      totalScore: 12,
      totalAssists: 4,
    }),
  );
  yield* query(
    db.insert(rosterPlayerGamedayLinks).values({
      id: "gameday-player-link",
      organizationId: ORG_ID,
      rosterPlayerId: PLAYER_ID,
      sourceId: "lacrosse-victoria",
      seasonId: "season-2026",
      compId: "comp-u14",
      gamedayTeamId: "gameday-malvern",
      gamedayPlayerId: "gameday-player",
    }),
  );
});

describe("StatsService integration", () => {
  it("keeps manual fixture stats source-aware, partial, and season isolated", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedStats;
        const service = yield* StatsService;

        const saved = yield* service.upsertFixtureStatSheet({
          organizationId: ORG_ID,
          fixtureId: FIXTURE_ID,
          submittedByUserId: USER_ID,
          goalsForOverride: 10,
          goalsAgainstOverride: 4,
          assistedGoals: 3,
          shots: 15,
          saves: null,
          players: [
            {
              rosterPlayerId: PLAYER_ID,
              goals: 2,
              assists: 1,
              shots: null,
              saves: 0,
            },
          ],
        });
        const overridden = yield* service.getTeamSeasonSummary({
          organizationId: ORG_ID,
          teamId: TEAM_ID,
        });
        const players = yield* service.getTeamPlayerStats({
          organizationId: ORG_ID,
          teamId: TEAM_ID,
        });

        expect(saved.team?.effectiveGoalsFor).toBe(10);
        expect(saved.players[0]?.points).toBe(3);
        expect(saved.players[0]?.shots).toBeNull();
        expect(saved.players[0]?.saves).toBe(0);
        expect(overridden.played).toBe(2);
        expect(overridden.goalsFor).toBe(18);
        expect(overridden.goalsAgainst).toBe(9);
        expect(overridden.gamesWithStats).toBe(1);
        expect(players.manual[0]?.points).toBe(3);
        expect(players.gameday[0]?.goals).toBe(12);
        expect(players.gameday[0]?.assists).toBe(4);
        expect(players.gameday[0]?.points).toBe(16);

        const db = yield* DrizzleService;
        yield* query(
          db
            .update(fixtures)
            .set({ homeScore: 7, awayScore: 5, updatedAt: new Date() })
            .where(eq(fixtures.id, FIXTURE_ID)),
        );
        const preserved = yield* service.getFixtureStatSheet({
          organizationId: ORG_ID,
          fixtureId: FIXTURE_ID,
        });
        expect(preserved.team?.effectiveGoalsFor).toBe(10);
        expect(preserved.team?.effectiveGoalsAgainst).toBe(4);

        yield* service.upsertFixtureStatSheet({
          organizationId: ORG_ID,
          fixtureId: FIXTURE_ID,
          submittedByUserId: USER_ID,
          goalsForOverride: null,
          goalsAgainstOverride: null,
          assistedGoals: 3,
          shots: 15,
          saves: null,
          players: [],
        });
        const fallback = yield* service.getTeamSeasonSummary({
          organizationId: ORG_ID,
          teamId: TEAM_ID,
        });
        expect(fallback.goalsFor).toBe(15);
        expect(fallback.goalsAgainst).toBe(10);
      }),
    ));

  it("accepts paired manual scores for a played fixture missing a GameDay result", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedStats;
        const service = yield* StatsService;

        const saved = yield* service.upsertFixtureStatSheet({
          organizationId: ORG_ID,
          fixtureId: MISSING_SCORE_FIXTURE_ID,
          submittedByUserId: USER_ID,
          goalsForOverride: 4,
          goalsAgainstOverride: 3,
          assistedGoals: 2,
          shots: 4,
          saves: null,
          players: [],
        });

        expect(saved.team?.effectiveGoalsFor).toBe(4);
        expect(saved.team?.effectiveGoalsAgainst).toBe(3);
      }),
    ));

  it("rejects cross-team players and returns the cached published ladder", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedStats;
        const service = yield* StatsService;

        const crossTeam = yield* service
          .upsertFixtureStatSheet({
            organizationId: ORG_ID,
            fixtureId: FIXTURE_ID,
            submittedByUserId: USER_ID,
            goalsForOverride: null,
            goalsAgainstOverride: null,
            assistedGoals: 0,
            shots: null,
            saves: null,
            players: [
              {
                rosterPlayerId: OTHER_PLAYER_ID,
                goals: 0,
                assists: 0,
                shots: null,
                saves: null,
              },
            ],
          })
          .pipe(Effect.exit);
        const standings = yield* service.getTeamStandings({
          organizationId: ORG_ID,
          teamId: TEAM_ID,
        });

        expect(crossTeam._tag).toBe("Failure");
        expect(standings.rows[0]?.position).toBe(3);
        expect(standings.rows[0]?.premiershipPoints).toBe(20);
        expect(standings.sourceUploadedAt).toBe("Thu 23-Jul-2026 14:03:47");
      }),
    ));

  it("fetches and caches the published ladder when the cache is empty", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedStats;
        const db = yield* DrizzleService;
        yield* query(db.delete(gamedayLadderRows));
        const service = yield* StatsService;

        const standings = yield* service.getTeamStandings({
          organizationId: ORG_ID,
          teamId: TEAM_ID,
        });
        const cached = yield* query(db.select().from(gamedayLadderRows));

        expect(standings.rows[0]?.teamName).toBe("Malvern/MCC");
        expect(standings.rows[0]?.premiershipPoints).toBe(20);
        expect(cached).toHaveLength(1);
        expect(cached[0]?.gamedayTeamId).toBe("gameday-malvern");
      }),
    ));

  it("fails closed when another organization guesses fixture and team ids", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedStats;
        const service = yield* StatsService;

        const fixtureRead = yield* service
          .getFixtureStatSheet({
            organizationId: OTHER_ORG_ID,
            fixtureId: FIXTURE_ID,
          })
          .pipe(Effect.exit);
        const fixtureWrite = yield* service
          .upsertFixtureStatSheet({
            organizationId: OTHER_ORG_ID,
            fixtureId: FIXTURE_ID,
            submittedByUserId: null,
            goalsForOverride: null,
            goalsAgainstOverride: null,
            assistedGoals: 0,
            shots: null,
            saves: null,
            players: [],
          })
          .pipe(Effect.exit);
        const teamRead = yield* service
          .getTeamSeasonSummary({
            organizationId: OTHER_ORG_ID,
            teamId: TEAM_ID,
          })
          .pipe(Effect.exit);

        expect(fixtureRead._tag).toBe("Failure");
        expect(fixtureWrite._tag).toBe("Failure");
        expect(teamRead._tag).toBe("Failure");
      }),
    ));

  it("excludes missing scores, preserves zero draws, and validates team totals", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedStats;
        const service = yield* StatsService;
        const db = yield* DrizzleService;

        const before = yield* service.getTeamSeasonSummary({
          organizationId: ORG_ID,
          teamId: TEAM_ID,
        });
        expect(before.played).toBe(2);

        yield* query(
          db
            .update(fixtures)
            .set({ homeScore: 0, awayScore: 0 })
            .where(eq(fixtures.id, SECOND_FIXTURE_ID)),
        );
        const withZeroDraw = yield* service.getTeamSeasonSummary({
          organizationId: ORG_ID,
          teamId: TEAM_ID,
        });
        expect(withZeroDraw.played).toBe(2);
        expect(withZeroDraw.draws).toBe(1);

        const tooManyAssists = yield* service
          .upsertFixtureStatSheet({
            organizationId: ORG_ID,
            fixtureId: FIXTURE_ID,
            submittedByUserId: USER_ID,
            goalsForOverride: null,
            goalsAgainstOverride: null,
            assistedGoals: 10,
            shots: null,
            saves: null,
            players: [],
          })
          .pipe(Effect.exit);
        const tooFewShots = yield* service
          .upsertFixtureStatSheet({
            organizationId: ORG_ID,
            fixtureId: FIXTURE_ID,
            submittedByUserId: USER_ID,
            goalsForOverride: null,
            goalsAgainstOverride: null,
            assistedGoals: 0,
            shots: 8,
            saves: null,
            players: [],
          })
          .pipe(Effect.exit);
        const halfOverride = yield* service
          .upsertFixtureStatSheet({
            organizationId: ORG_ID,
            fixtureId: FIXTURE_ID,
            submittedByUserId: USER_ID,
            goalsForOverride: 9,
            goalsAgainstOverride: null,
            assistedGoals: 0,
            shots: null,
            saves: null,
            players: [],
          })
          .pipe(Effect.exit);

        expect(tooManyAssists._tag).toBe("Failure");
        expect(tooFewShots._tag).toBe("Failure");
        expect(halfOverride._tag).toBe("Failure");
      }),
    ));
});
