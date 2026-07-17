import { ApiClient } from "@laxdb/api/client";
import type {
  GamedayClub,
  GamedayCompetition,
  GamedaySeason,
  GamedayTeam,
  GamedayTeamCompetition,
} from "@laxdb/core/match/gameday";
import type { SyncGamedayAssociationSeasonResult } from "@laxdb/core/match/gameday.schema";
import type {
  Fixture,
  MatchImage,
  MatchReport,
} from "@laxdb/core/match/match.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { apiAuth, runApi } from "./api-client";

export type FixtureView = typeof Fixture.Type;
export type MatchReportView = typeof MatchReport.Type;
export type MatchImageView = typeof MatchImage.Type;
export type CompetitionView = typeof GamedayCompetition.Type;
export type GamedaySeasonView = typeof GamedaySeason.Type;
export type GamedayClubView = typeof GamedayClub.Type;
export type GamedayTeamView = typeof GamedayTeam.Type;
export type GamedayTeamCompetitionView = typeof GamedayTeamCompetition.Type;
export type SyncGamedayAssociationSeasonView =
  typeof SyncGamedayAssociationSeasonResult.Type;

export const listFixtures = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listFixtures({ payload: data });
      }),
    ),
  );

export const getFixture = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.getFixture({ payload: data });
      }),
    ),
  );

export const syncFixtures = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.syncFixtures({ payload: data });
      }),
    ),
  );

export const syncGamedayAssociationSeason = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: { seasonId?: string; includeRosters?: boolean }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.syncGamedayAssociationSeason({
          payload: data,
        });
      }),
    ),
  );

export const importGamedayTeams = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      seasonId: string;
      teams: readonly GamedayTeamCompetitionView[];
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.importGamedayTeams({ payload: data });
      }),
    ),
  );

export const listCompetitions = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { seasonId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listCompetitions({ payload: data });
      }),
    ),
  );

export const listGamedayTeams = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { compId: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listGamedayTeams({ payload: data });
      }),
    ),
  );

export const listGamedaySeasons = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .handler(({ context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listGamedaySeasons({ payload: {} });
      }),
    ),
  );

export const listGamedayClubs = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { seasonId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listGamedayClubs({ payload: data });
      }),
    ),
  );

export const listCompetitionsForClubs = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { clubNames: string[]; seasonId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listCompetitionsForClubs({
          payload: data,
        });
      }),
    ),
  );

export const listReports = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listReports({ payload: data });
      }),
    ),
  );

export const submitReport = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      fixtureId: string;
      topPlayer1Id: string;
      topPlayer2Id?: string | null;
      topPlayer3Id?: string | null;
      blurb?: string | null;
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.submitReport({ payload: data });
      }),
    ),
  );

export const listMatchImages = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { fixtureId: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.listMatchImages({ payload: data });
      }),
    ),
  );

export const uploadMatchImage = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      fixtureId: string;
      fileName: string;
      contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      dataBase64: string;
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.uploadMatchImage({ payload: data });
      }),
    ),
  );

export const deleteMatchImage = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Matches.deleteMatchImage({ payload: data });
      }),
    ),
  );
