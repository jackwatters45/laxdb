import { ApiClient } from "@laxdb/api/client";
import type {
  ClubTeam,
  ReportRecipient,
  RosterPlayer,
} from "@laxdb/core/club/club.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { apiAuth, runApi } from "./api-client";

export type TeamView = typeof ClubTeam.Type;
export type RosterPlayerView = typeof RosterPlayer.Type;
export type RecipientView = typeof ReportRecipient.Type;

export const listTeams = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .handler(({ context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.listTeams({ payload: {} });
      }),
    ),
  );

export const createTeam = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      name: string;
      gamedayCompId?: string | null;
      gamedayTeamId?: string | null;
      coachMemberId?: string | null;
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.createTeam({ payload: data });
      }),
    ),
  );

export const updateTeam = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      id: string;
      name?: string;
      gamedayCompId?: string | null;
      gamedayTeamId?: string | null;
      coachMemberId?: string | null;
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.updateTeam({ payload: data });
      }),
    ),
  );

export const deleteTeam = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.deleteTeam({ payload: data });
      }),
    ),
  );

export const listRoster = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.listRoster({ payload: data });
      }),
    ),
  );

export const addRosterPlayer = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: { teamId: string; name: string; jerseyNumber?: number | null }) =>
      input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.addRosterPlayer({ payload: data });
      }),
    ),
  );

export const updateRosterPlayer = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      id: string;
      name?: string;
      jerseyNumber?: number | null;
      active?: boolean;
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.updateRosterPlayer({ payload: data });
      }),
    ),
  );

export const removeRosterPlayer = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.removeRosterPlayer({ payload: data });
      }),
    ),
  );

export const listRecipients = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .handler(({ context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.listRecipients({ payload: {} });
      }),
    ),
  );

export const listRecipientsForTeam = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { teamId: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.listRecipientsForTeam({ payload: data });
      }),
    ),
  );

export const addRecipient = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: { teamId?: string | null; label: string; email: string }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.addRecipient({ payload: data });
      }),
    ),
  );

export const removeRecipient = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Club.removeRecipient({ payload: data });
      }),
    ),
  );
