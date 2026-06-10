import { ApiClient } from "@laxdb/api/client";
import type {
  MalvernFixture,
  MalvernPlayer,
  MalvernTeam,
  MalvernTeamCoach,
  MalvernTopThreeSubmission,
} from "@laxdb/core/malvern/malvern.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { runApi } from "./api-client";

export type TeamView = typeof MalvernTeam.Type;
export type CoachView = typeof MalvernTeamCoach.Type;
export type PlayerView = typeof MalvernPlayer.Type;
export type FixtureView = typeof MalvernFixture.Type;
export type TopThreeSubmissionView = typeof MalvernTopThreeSubmission.Type;

export const listTeams = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* client.Malvern.listTeams({ payload: {} });
    }),
  ),
);

export const createTeam = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      name: string;
      grade?: string | null | undefined;
      sourceUrl?: string | null | undefined;
      defaultRecipientEmails?: string[] | undefined;
    }) => input,
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.createTeam({ payload: data });
      }),
    ),
  );

export const updateTeam = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      teamPublicId: string;
      name?: string | undefined;
      grade?: string | null | undefined;
      sourceUrl?: string | null | undefined;
      defaultRecipientEmails?: string[] | undefined;
    }) => input,
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.updateTeam({ payload: data });
      }),
    ),
  );

export const assignCoach = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { teamPublicId: string; coachUserId: string }) => input,
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.assignCoach({ payload: data });
      }),
    ),
  );

export const listCoaches = createServerFn({ method: "GET" })
  .inputValidator((input: { teamPublicId: string }) => input)
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.listCoaches({ payload: data });
      }),
    ),
  );

export const listPlayers = createServerFn({ method: "GET" })
  .inputValidator((input: { teamPublicId: string }) => input)
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.listPlayers({ payload: data });
      }),
    ),
  );

export const createPlayer = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      teamPublicId: string;
      name: string;
      jumperNumber?: number | null | undefined;
    }) => input,
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.createPlayer({ payload: data });
      }),
    ),
  );

export const listFixtures = createServerFn({ method: "GET" })
  .inputValidator((input: { teamPublicId: string }) => input)
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.listFixtures({ payload: data });
      }),
    ),
  );

export const syncFixtures = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { teamPublicId: string; sourceUrl?: string | null | undefined }) =>
      input,
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.syncFixtures({ payload: data });
      }),
    ),
  );

export const submitTopThree = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      fixturePublicId: string;
      firstPlayerPublicId: string;
      secondPlayerPublicId: string;
      thirdPlayerPublicId: string;
      blurb?: string | null | undefined;
      recipientEmails: string[];
    }) => input,
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.submitTopThree({ payload: data });
      }),
    ),
  );

export const listSubmissions = createServerFn({ method: "GET" })
  .inputValidator((input: { teamPublicId?: string | undefined }) => input)
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Malvern.listSubmissions({ payload: data });
      }),
    ),
  );
