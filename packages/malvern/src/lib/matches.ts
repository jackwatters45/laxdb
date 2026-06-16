import { ApiClient } from "@laxdb/api/client";
import type { GamedayCompetition } from "@laxdb/core/match/gameday";
import type { Fixture, MatchReport } from "@laxdb/core/match/match.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { apiAuth, runApi } from "./api-client";

export type FixtureView = typeof Fixture.Type;
export type MatchReportView = typeof MatchReport.Type;
export type CompetitionView = typeof GamedayCompetition.Type;

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
      recipientIds: string[];
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
