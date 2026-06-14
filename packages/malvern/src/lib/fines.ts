import { ApiClient } from "@laxdb/api/client";
import type {
  Fine,
  FineAuditEntry,
  FineMember,
  FineTemplate,
} from "@laxdb/core/fine/fine.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { apiAuth, runApi } from "./api-client";

export type Member = typeof FineMember.Type;
export type FineTemplateView = typeof FineTemplate.Type;
export type FineView = typeof Fine.Type;
export type AuditEntry = typeof FineAuditEntry.Type;

export const listMembers = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .handler(({ context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.listMembers({ payload: {} });
      }),
    ),
  );

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .handler(({ context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.listTemplates({ payload: {} });
      }),
    ),
  );

export const createTemplate = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { label: string; amountCents: number }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.createTemplate({ payload: data });
      }),
    ),
  );

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.deleteTemplate({ payload: data });
      }),
    ),
  );

export const listFines = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .handler(({ context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.listFines({ payload: {} });
      }),
    ),
  );

export const listMemberFines = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { memberId: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.listMemberFines({ payload: data });
      }),
    ),
  );

export const issueFine = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: {
      memberId: string;
      templateId?: string | null | undefined;
      reason?: string | null | undefined;
      amountCents?: number | undefined;
    }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.issueFine({ payload: data });
      }),
    ),
  );

export const payFine = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.payFine({ payload: data });
      }),
    ),
  );

export const forgiveFine = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator((input: { id: string; note: string | null }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.forgiveFine({ payload: data });
      }),
    ),
  );

export const adjustFine = createServerFn({ method: "POST" })
  .middleware([apiAuth])
  .inputValidator(
    (input: { id: string; amountCents: number; note: string | null }) => input,
  )
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.adjustFine({ payload: data });
      }),
    ),
  );

export const listAudit = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .inputValidator((input: { limit?: number | undefined }) => input)
  .handler(({ data, context }) =>
    runApi(
      context.apiCookie,
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Fines.listAudit({ payload: data });
      }),
    ),
  );
