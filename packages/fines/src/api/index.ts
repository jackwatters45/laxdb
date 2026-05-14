import { Effect, type Layer } from "effect";

import { createAuth, type Auth } from "../core/auth/auth";
import { resolveMe } from "../core/auth/resolveMe";
import type { Me } from "../core/auth/schema";
import type { Db } from "../core/db";
import { DbLive } from "../core/db";
import * as FineService from "../core/fine/fine.service";
import * as FineTemplateService from "../core/fine/fineTemplate.service";

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TRUSTED_ORIGINS?: string;
};

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

const run = <A, E>(
  eff: Effect.Effect<A, E, Db>,
  layer: Layer.Layer<Db>,
): Promise<A> => Effect.runPromise(eff.pipe(Effect.provide(layer)));

const badRequest = (msg: string) => json({ error: msg }, { status: 400 });
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
      .map((s) => s.trim())
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

const handleFetch = async (req: Request, env: Env): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const layer = DbLive(env.DB);
  const auth = makeAuth(env);

  if (path === "/health") return new Response("OK");

  const session = await getSession(auth, req);
  if (session === null) return unauthorized();

  const isAdmin =
    session.memberRole === "owner" || session.memberRole === "admin";

  const requireOrg = (): string | Response => {
    const organizationId = session.activeOrganizationId;
    return organizationId === null ? forbidden() : organizationId;
  };
  const requireAdmin = (): string | Response => {
    const organizationId = requireOrg();
    if (organizationId instanceof Response) return organizationId;
    return isAdmin ? organizationId : forbidden();
  };

  // me
  if (path === "/api/me" && method === "GET") {
    return json(session);
  }

  // org-scoped members
  if (path === "/api/members" && method === "GET") {
    const organizationId = requireOrg();
    if (organizationId instanceof Response) return organizationId;
    return json(await run(FineService.listOrgMembers(organizationId), layer));
  }

  // fine templates
  if (path === "/api/fine-templates" && method === "GET") {
    const organizationId = requireOrg();
    if (organizationId instanceof Response) return organizationId;
    return json(await run(FineTemplateService.list(organizationId), layer));
  }
  if (path === "/api/fine-templates" && method === "POST") {
    const organizationId = requireAdmin();
    if (organizationId instanceof Response) return organizationId;
    const body = await readJsonObject(req);
    const label = optionalString(body?.label);
    const amountCents = optionalNumber(body?.amountCents);
    if (label === undefined || amountCents === undefined) {
      return badRequest("label and amountCents required");
    }
    return json(
      await run(
        FineTemplateService.create({
          organizationId,
          label,
          amountCents,
        }),
        layer,
      ),
      { status: 201 },
    );
  }

  const templateMatch = path.match(/^\/api\/fine-templates\/([^/]+)$/u);
  if (templateMatch && method === "PATCH") {
    const organizationId = requireAdmin();
    if (organizationId instanceof Response) return organizationId;
    const templateId = templateMatch.at(1);
    if (templateId === undefined) return badRequest("template id required");
    const body = await readJsonObject(req);
    if (body === null) return badRequest("JSON object required");
    const label = optionalString(body.label);
    const amountCents = optionalNumber(body.amountCents);
    await run(
      FineTemplateService.update(templateId, {
        ...(label === undefined ? {} : { label }),
        ...(amountCents === undefined ? {} : { amountCents }),
      }),
      layer,
    );
    return json({ ok: true });
  }
  if (templateMatch && method === "DELETE") {
    const organizationId = requireAdmin();
    if (organizationId instanceof Response) return organizationId;
    const templateId = templateMatch.at(1);
    if (templateId === undefined) return badRequest("template id required");
    await run(FineTemplateService.remove(templateId), layer);
    return json({ ok: true });
  }

  // fines
  if (path === "/api/fines" && method === "GET") {
    const organizationId = requireOrg();
    if (organizationId instanceof Response) return organizationId;
    return json(await run(FineService.list(organizationId), layer));
  }
  if (path === "/api/fines" && method === "POST") {
    const organizationId = requireAdmin();
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
      await run(
        FineService.issue({
          organizationId,
          memberId,
          issuedByUserId: session.userId,
          ...(templateId === undefined ? {} : { templateId }),
          ...(reason === undefined ? {} : { reason }),
          ...(amountCents === undefined ? {} : { amountCents }),
          ...(dueAt === undefined ? {} : { dueAt }),
        }),
        layer,
      ),
      { status: 201 },
    );
  }

  const fineActionMatch = path.match(/^\/api\/fines\/([^/]+)\/([a-z]+)$/u);
  if (fineActionMatch && method === "POST") {
    const organizationId = requireAdmin();
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
      return json(await run(FineService.pay(id, session.userId), layer));
    }
    if (action === "forgive") {
      return json(
        await run(FineService.forgive(id, session.userId, note), layer),
      );
    }
    if (action === "adjust") {
      if (amountCents === undefined) return badRequest("amountCents required");
      return json(
        await run(
          FineService.adjust(id, amountCents, session.userId, note),
          layer,
        ),
      );
    }
    return badRequest(`unknown action ${action}`);
  }

  const fineEventsMatch = path.match(/^\/api\/fines\/([^/]+)\/events$/u);
  if (fineEventsMatch && method === "GET") {
    const organizationId = requireOrg();
    if (organizationId instanceof Response) return organizationId;
    const fineId = fineEventsMatch.at(1);
    if (fineId === undefined) return badRequest("fine id required");
    return json(await run(FineService.listEvents(fineId), layer));
  }

  if (path === "/api/audit" && method === "GET") {
    const organizationId = requireOrg();
    if (organizationId instanceof Response) return organizationId;
    const limit = Number(url.searchParams.get("limit") ?? 100);
    return json(
      await run(FineService.listOrgAudit(organizationId, limit), layer),
    );
  }

  const memberFinesMatch = path.match(/^\/api\/members\/([^/]+)\/fines$/u);
  if (memberFinesMatch && method === "GET") {
    const organizationId = requireOrg();
    if (organizationId instanceof Response) return organizationId;
    const memberId = memberFinesMatch.at(1);
    if (memberId === undefined) return badRequest("member id required");
    return json(await run(FineService.listForMember(memberId), layer));
  }

  return new Response("Not Found", { status: 404 });
};

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return handleFetch(req, env);
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const layer = DbLive(env.DB);
    await Effect.runPromise(
      FineService.applyDoublings().pipe(Effect.provide(layer)),
    );
  },
} satisfies ExportedHandler<Env>;
