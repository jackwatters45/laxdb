import { describe, expect, it } from "@effect/vitest";
import { members, organizations, users } from "@laxdb/core/auth/auth.sql";
import { ClubRepo } from "@laxdb/core/club/club.repo";
import { clubTeams } from "@laxdb/core/club/club.sql";
import { DrizzleService, query } from "@laxdb/core/drizzle/drizzle.service";
import { EmailService } from "@laxdb/core/email/email.service";
import { Effect, Layer } from "effect";

import { TestDatabaseLive, truncateAll } from "../test/db";
import { makeTestRunner } from "../test/effect";

import { GamedayClient } from "./gameday";
import { GamedayRepo } from "./gameday.repo";
import { MatchRepo } from "./match.repo";
import { MatchService } from "./match.service";
import { fixtures } from "./match.sql";

const ORG_ID = "org-match-images";
const USER_ID = "user-match-images";
const MEMBER_ID = "member-match-images";
const TEAM_ID = "team-match-images";
const FIXTURE_ID = "fixture-match-images";

const UnexpectedGameDayLive = Layer.succeed(GamedayClient, {
  fetchSeasons: () => Effect.die("GameDay should not be called"),
  fetchCompetitions: () => Effect.die("GameDay should not be called"),
  fetchFixtures: () => Effect.die("GameDay should not be called"),
  fetchTeams: () => Effect.die("GameDay should not be called"),
  fetchRoster: () => Effect.die("GameDay should not be called"),
  fetchClubs: () => Effect.die("GameDay should not be called"),
  fetchCompetitionsForClubs: () => Effect.die("GameDay should not be called"),
});

const DependenciesLive = Layer.mergeAll(
  MatchRepo.layer,
  ClubRepo.layer,
  GamedayRepo.layer,
  UnexpectedGameDayLive,
  EmailService.layerFromConfig({
    apiKey: "",
    sender: "Match images <test@example.com>",
  }),
).pipe(Layer.provide(TestDatabaseLive));

const MatchServiceLive = Layer.effect(MatchService, MatchService.make).pipe(
  Layer.provide(DependenciesLive),
);
const TestLayer = Layer.mergeAll(MatchServiceLive, TestDatabaseLive);
const run = makeTestRunner(TestLayer);

const seedFixture = Effect.gen(function* () {
  const db = yield* DrizzleService;
  yield* query(
    db.insert(users).values({
      id: USER_ID,
      name: "Image Tester",
      email: "images@example.com",
      emailVerified: true,
    }),
  );
  yield* query(
    db.insert(organizations).values({
      id: ORG_ID,
      name: "Match Images Club",
      slug: "match-images-club",
    }),
  );
  yield* query(
    db.insert(members).values({
      id: MEMBER_ID,
      organizationId: ORG_ID,
      userId: USER_ID,
      role: "member",
    }),
  );
  yield* query(
    db.insert(clubTeams).values({
      id: TEAM_ID,
      organizationId: ORG_ID,
      name: "Firsts",
    }),
  );
  yield* query(
    db.insert(fixtures).values({
      id: FIXTURE_ID,
      organizationId: ORG_ID,
      teamId: TEAM_ID,
      gamedayFixtureId: "gameday-match-images",
      compId: "comp-images",
      compName: "Premier League",
      round: "1",
      scheduledAt: new Date("2026-06-20T10:00:00Z"),
      homeTeamName: "Malvern Lacrosse Club",
      awayTeamName: "Visitors",
      isHome: true,
      venueName: null,
      matchStatus: null,
      homeScore: null,
      awayScore: null,
    }),
  );
});

describe("MatchService image metadata integration", () => {
  it("stores, scopes, lists, and deletes a fixture image", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFixture;
        const service = yield* MatchService;

        const image = yield* service.createMatchImage({
          organizationId: ORG_ID,
          fixtureId: FIXTURE_ID,
          uploadedByUserId: USER_ID,
          fileName: "opening-whistle.png",
          contentType: "image/png",
          sizeBytes: 1_024,
        });
        const visible = yield* service.listMatchImages({
          organizationId: ORG_ID,
          fixtureId: FIXTURE_ID,
        });
        const wrongOrganization = yield* service
          .getMatchImage({ organizationId: "other-org", id: image.id })
          .pipe(Effect.exit);
        const deleted = yield* service.deleteMatchImage({
          organizationId: ORG_ID,
          id: image.id,
        });
        const afterDelete = yield* service.listMatchImages({
          organizationId: ORG_ID,
          fixtureId: FIXTURE_ID,
        });

        expect(image.fixtureId).toBe(FIXTURE_ID);
        expect(image.objectKey).toContain(`${ORG_ID}/${FIXTURE_ID}/`);
        expect(visible.map((entry) => entry.id)).toEqual([image.id]);
        expect(wrongOrganization._tag).toBe("Failure");
        expect(deleted.id).toBe(image.id);
        expect(afterDelete).toEqual([]);
      }),
    ));
});
