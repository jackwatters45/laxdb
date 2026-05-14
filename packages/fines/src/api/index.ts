import { DatabaseLiveFromBinding } from "@laxdb/core/drizzle/drizzle.service";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { Effect, Layer } from "effect";

import { createAuth, type Auth } from "../core/auth/auth";
import { resolveMe } from "../core/auth/resolve-me";
import type { Me } from "../core/auth/schema";
import { FineService } from "../core/fine/fine.service";

// Local Fines HTTP adapter. The implementation below intentionally mirrors the
// shared api/core layering, but stays inside packages/fines until the app moves.

type Env = {
  readonly DB: D1Database;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly TRUSTED_ORIGINS?: string;
};

const json = (data: unknown, init?: ResponseInit) => {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
};

const badRequest = (message: string) =>
  json({ error: message }, { status: 400 });
const unauthorized = () => json({ error: "unauthorized" }, { status: 401 });
const forbidden = () => json({ error: "forbidden" }, { status: 403 });

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const readJsonObject = async (
  req: Request,
): Promise<Readonly<Record<string, unknown>> | null> => {
  try {
    const value: unknown = await req.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
};

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const optionalStringOrNull = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  return optionalString(value);
};

const optionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const getSession = (auth: Auth, req: Request): Promise<Me | null> =>
  resolveMe(auth, req.headers);

const makeAuth = (env: Env): Auth =>
  createAuth({
    db: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.TRUSTED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    useSecureCookies: !env.BETTER_AUTH_URL.startsWith("http://"),
    sendMagicLink: ({ email, url }) => {
      console.log(`[magic-link] to=${email} url=${url}`);
    },
    sendInvitationEmail: ({ email, inviteLink, organizationName }) => {
      console.log(
        `[invite] to=${email} org=${organizationName} link=${inviteLink}`,
      );
    },
  });

const fineLayer = (env: Env) =>
  FineService.layer.pipe(Layer.provide(DatabaseLiveFromBinding(env.DB)));

type FineServiceImpl = typeof FineService.Service;

const runFine = async <A, E>(
  env: Env,
  operation: (service: FineServiceImpl) => Effect.Effect<A, E>,
): Promise<A> =>
  Effect.gen(function* () {
    const service = yield* FineService;
    return yield* operation(service);
  }).pipe(Effect.provide(fineLayer(env)), Effect.runPromise);

const isAdmin = (session: Me) =>
  session.memberRole === "owner" || session.memberRole === "admin";

const requireOrg = (session: Me): string | Response => {
  const organizationId = session.activeOrganizationId;
  return organizationId ?? forbidden();
};

const requireAdmin = (session: Me): string | Response => {
  const organizationId = requireOrg(session);
  if (organizationId instanceof Response) return organizationId;
  return isAdmin(session) ? organizationId : forbidden();
};

const routeError = (cause: unknown) => {
  if (cause instanceof NotFoundError) return json(cause, { status: 404 });
  if (cause instanceof ValidationError) return json(cause, { status: 400 });
  if (cause instanceof ConstraintViolationError) {
    return json(cause, { status: 409 });
  }
  if (cause instanceof DatabaseError) return json(cause, { status: 500 });
  return json({ error: String(cause) }, { status: 500 });
};

const handleFetch = async (req: Request, env: Env): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const auth = makeAuth(env);

  if (path === "/health") return new Response("OK");

  const session = await getSession(auth, req);
  if (session === null) return unauthorized();

  if (path === "/api/me" && method === "GET") {
    return json(session);
  }

  if (path === "/api/members" && method === "GET") {
    const organizationId = requireOrg(session);
    if (organizationId instanceof Response) return organizationId;
    return json(
      await runFine(env, (service) => service.listMembers({ organizationId })),
    );
  }

  if (path === "/api/fine-templates" && method === "GET") {
    const organizationId = requireOrg(session);
    if (organizationId instanceof Response) return organizationId;
    return json(
      await runFine(env, (service) =>
        service.listTemplates({ organizationId }),
      ),
    );
  }

  if (path === "/api/fine-templates" && method === "POST") {
    const organizationId = requireAdmin(session);
    if (organizationId instanceof Response) return organizationId;
    const body = await readJsonObject(req);
    const label = optionalString(body?.label);
    const amountCents = optionalNumber(body?.amountCents);
    if (label === undefined || amountCents === undefined) {
      return badRequest("label and amountCents required");
    }
    return json(
      await runFine(env, (service) =>
        service.createTemplate({ organizationId, label, amountCents }),
      ),
      { status: 201 },
    );
  }

  const templateMatch = path.match(/^\/api\/fine-templates\/([^/]+)$/u);
  if (templateMatch && method === "PATCH") {
    const organizationId = requireAdmin(session);
    if (organizationId instanceof Response) return organizationId;
    const id = templateMatch.at(1);
    if (id === undefined) return badRequest("template id required");
    const body = await readJsonObject(req);
    if (body === null) return badRequest("JSON object required");
    const label = optionalString(body.label);
    const amountCents = optionalNumber(body.amountCents);
    await runFine(env, (service) =>
      service.updateTemplate({
        organizationId,
        id,
        ...(label === undefined ? {} : { label }),
        ...(amountCents === undefined ? {} : { amountCents }),
      }),
    );
    return json({ ok: true });
  }

  if (templateMatch && method === "DELETE") {
    const organizationId = requireAdmin(session);
    if (organizationId instanceof Response) return organizationId;
    const id = templateMatch.at(1);
    if (id === undefined) return badRequest("template id required");
    await runFine(env, (service) =>
      service.deleteTemplate({ organizationId, id }),
    );
    return json({ ok: true });
  }

  if (path === "/api/fines" && method === "GET") {
    const organizationId = requireOrg(session);
    if (organizationId instanceof Response) return organizationId;
    return json(
      await runFine(env, (service) => service.list({ organizationId })),
    );
  }

  if (path === "/api/fines" && method === "POST") {
    const organizationId = requireAdmin(session);
    if (organizationId instanceof Response) return organizationId;
    const body = await readJsonObject(req);
    const memberId = optionalString(body?.memberId);
    if (memberId === undefined) return badRequest("memberId required");
    const templateId = optionalStringOrNull(body?.templateId);
    const reason = optionalStringOrNull(body?.reason);
    const amountCents = optionalNumber(body?.amountCents);
    const dueAtRaw = optionalString(body?.dueAt);
    const dueAt = dueAtRaw === undefined ? undefined : new Date(dueAtRaw);
    return json(
      await runFine(env, (service) =>
        service.issue({
          organizationId,
          memberId,
          issuedByUserId: session.userId,
          ...(templateId === undefined ? {} : { templateId }),
          ...(reason === undefined ? {} : { reason }),
          ...(amountCents === undefined ? {} : { amountCents }),
          ...(dueAt === undefined ? {} : { dueAt }),
        }),
      ),
      { status: 201 },
    );
  }

  const fineActionMatch = path.match(/^\/api\/fines\/([^/]+)\/([a-z]+)$/u);
  if (fineActionMatch && method === "POST") {
    const organizationId = requireAdmin(session);
    if (organizationId instanceof Response) return organizationId;
    const id = fineActionMatch.at(1);
    const action = fineActionMatch.at(2);
    if (id === undefined || action === undefined) {
      return badRequest("fine action path required");
    }
    const body = (await readJsonObject(req)) ?? {};
    const note = optionalStringOrNull(body.note);
    const amountCents = optionalNumber(body.amountCents);
    if (action === "pay") {
      return json(
        await runFine(env, (service) =>
          service.pay({
            organizationId,
            id,
            actorUserId: session.userId,
          }),
        ),
      );
    }
    if (action === "forgive") {
      return json(
        await runFine(env, (service) =>
          service.forgive({
            organizationId,
            id,
            actorUserId: session.userId,
            note,
          }),
        ),
      );
    }
    if (action === "adjust") {
      if (amountCents === undefined) return badRequest("amountCents required");
      return json(
        await runFine(env, (service) =>
          service.adjust({
            organizationId,
            id,
            actorUserId: session.userId,
            amountCents,
            note,
          }),
        ),
      );
    }
    return badRequest(`unknown action ${action}`);
  }

  const fineEventsMatch = path.match(/^\/api\/fines\/([^/]+)\/events$/u);
  if (fineEventsMatch && method === "GET") {
    const organizationId = requireOrg(session);
    if (organizationId instanceof Response) return organizationId;
    const id = fineEventsMatch.at(1);
    if (id === undefined) return badRequest("fine id required");
    return json(
      await runFine(env, (service) =>
        service.listEvents({ organizationId, id }),
      ),
    );
  }

  if (path === "/api/audit" && method === "GET") {
    const organizationId = requireOrg(session);
    if (organizationId instanceof Response) return organizationId;
    const rawLimit = Number(url.searchParams.get("limit") ?? 100);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 100;
    return json(
      await runFine(env, (service) =>
        service.listAudit({ organizationId, limit }),
      ),
    );
  }

  const memberFinesMatch = path.match(/^\/api\/members\/([^/]+)\/fines$/u);
  if (memberFinesMatch && method === "GET") {
    const organizationId = requireOrg(session);
    if (organizationId instanceof Response) return organizationId;
    const memberId = memberFinesMatch.at(1);
    if (memberId === undefined) return badRequest("member id required");
    return json(
      await runFine(env, (service) =>
        service.listForMember({ organizationId, memberId }),
      ),
    );
  }

  return new Response("Not Found", { status: 404 });
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      return await handleFetch(req, env);
    } catch (cause) {
      return routeError(cause);
    }
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await runFine(env, (service) => service.applyDoublings({}));
  },
} satisfies ExportedHandler<Env>;
