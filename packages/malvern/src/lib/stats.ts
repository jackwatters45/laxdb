import { ApiClient } from "@laxdb/api/client";
import type {
  FixtureStatSheet,
  TeamPlayerStats,
  TeamSeasonSummary,
  TeamStandings,
} from "@laxdb/core/stats/stats.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { apiAuth, runApi } from "./api-client";

export type FixtureStatSheetView = typeof FixtureStatSheet.Type;
export type TeamSeasonSummaryView = typeof TeamSeasonSummary.Type;
export type TeamPlayerStatsView = typeof TeamPlayerStats.Type;
export type TeamStandingsView = typeof TeamStandings.Type;

export type FixturePlayerStatInput = {
  readonly rosterPlayerId: string;
  readonly goals: number;
  readonly assists: number;
  readonly shots: number | null;
  readonly saves: number | null;
};

export const getFixtureStats = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { fixtureId: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Stats.getFixtureStats({ payload: data });
      }),
    ),
  );

export const upsertFixtureStats = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      fixtureId: string;
      goalsForOverride: number | null;
      goalsAgainstOverride: number | null;
      assistedGoals: number;
      shots: number | null;
      saves: number | null;
      players: readonly FixturePlayerStatInput[];
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Stats.upsertFixtureStats({ payload: data });
      }),
    ),
  );

export const getTeamSummary = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId: string; seasonId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Stats.getTeamSummary({ payload: data });
      }),
    ),
  );

export const getTeamPlayerStats = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId: string; seasonId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Stats.getTeamPlayerStats({ payload: data });
      }),
    ),
  );

export const getTeamStandings = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId: string; seasonId?: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Stats.getTeamStandings({ payload: data });
      }),
    ),
  );
