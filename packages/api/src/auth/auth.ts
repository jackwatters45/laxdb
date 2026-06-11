import type { D1Database } from "@cloudflare/workers-types";
import { createAuth, type Auth } from "@laxdb/core/auth/auth";
import type { Me } from "@laxdb/core/auth/auth.schema";
import type { AuthService } from "@laxdb/core/auth/auth.service";
import {
  DEFAULT_EMAIL_SENDER,
  sendViaResend,
  type EmailConfig,
} from "@laxdb/core/email/email.service";
import { AuthenticationError, AuthorizationError } from "@laxdb/core/error";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";

export type AuthEnv = {
  readonly DB: D1Database;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly TRUSTED_ORIGINS?: string;
  readonly RESEND_API_KEY?: string;
  readonly EMAIL_SENDER?: string;
};

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

export const isAuthEnv = (value: unknown): value is AuthEnv =>
  isRecord(value) &&
  isRecord(value.DB) &&
  typeof value.BETTER_AUTH_SECRET === "string" &&
  typeof value.BETTER_AUTH_URL === "string" &&
  (value.TRUSTED_ORIGINS === undefined ||
    typeof value.TRUSTED_ORIGINS === "string");

/** Email config from the worker environment; empty api key = log-only mode. */
export const emailConfigFromEnv = (env: unknown): EmailConfig => {
  const read = (key: string) => {
    if (!isRecord(env)) return;
    const value = env[key];
    return typeof value === "string" && value !== "" ? value : undefined;
  };
  return {
    apiKey: read("RESEND_API_KEY") ?? "",
    sender: read("EMAIL_SENDER") ?? DEFAULT_EMAIL_SENDER,
  };
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const deliverAuthEmail = async (
  env: AuthEnv,
  input: {
    readonly to: string;
    readonly subject: string;
    readonly intro: string;
    readonly linkLabel: string;
    readonly link: string;
  },
) => {
  const config = emailConfigFromEnv(env);
  if (config.apiKey === "") {
    console.log(
      `[email:dev] to=${input.to} subject=${input.subject} link=${input.link}`,
    );
    return;
  }
  await sendViaResend(config, {
    to: [input.to],
    subject: input.subject,
    text: `${input.intro}\n\n${input.link}\n\nIf you weren't expecting this email, you can ignore it.`,
    html: [
      `<p>${escapeHtml(input.intro)}</p>`,
      `<p><a href="${input.link}">${escapeHtml(input.linkLabel)}</a></p>`,
      `<p style="color:#888;font-size:0.85em">If you weren't expecting this email, you can ignore it.</p>`,
    ].join("\n"),
  });
};

const buildAuth = (env: AuthEnv): Auth =>
  createAuth({
    db: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.TRUSTED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    useSecureCookies: !env.BETTER_AUTH_URL.startsWith("http://"),
    sendMagicLink: ({ email, url }) =>
      deliverAuthEmail(env, {
        to: email,
        subject: "Sign in to Malvern Lacrosse",
        intro: "Use the link below to sign in. It expires in 15 minutes.",
        linkLabel: "Sign in",
        link: url,
      }),
    sendInvitationEmail: ({
      email,
      inviteLink,
      inviterName,
      organizationName,
    }) =>
      deliverAuthEmail(env, {
        to: email,
        subject: `You're invited to ${organizationName}`,
        intro: `${inviterName} invited you to join ${organizationName} on Malvern Lacrosse.`,
        linkLabel: "Accept invitation",
        link: inviteLink,
      }),
  });

/**
 * Better Auth instance for the worker environment. Construction builds the
 * drizzle adapter and plugin chain, so cache per D1 binding (one per worker
 * isolate) instead of rebuilding on every request.
 */
const authCache = new WeakMap<object, Auth>();

export const makeAuth = (env: AuthEnv): Auth => {
  const cached = authCache.get(env.DB);
  if (cached !== undefined) return cached;
  const auth = buildAuth(env);
  authCache.set(env.DB, auth);
  return auth;
};

type AuthServiceImpl = typeof AuthService.Service;

export const currentSession = (authService: AuthServiceImpl) =>
  Effect.gen(function* () {
    const env = yield* Cloudflare.WorkerEnvironment;
    const request = yield* HttpServerRequest.HttpServerRequest;
    if (!isAuthEnv(env)) {
      return yield* new AuthenticationError({
        message: "auth environment is invalid",
      });
    }
    const session = yield* authService.resolveMe(
      makeAuth(env),
      new Headers(request.headers),
    );
    if (session === null) {
      return yield* new AuthenticationError({ message: "unauthorized" });
    }
    return session;
  });

const isAdmin = (session: Me) =>
  session.memberRole === "owner" || session.memberRole === "admin";

export const organizationId = (session: Me) =>
  session.activeOrganizationId === null
    ? Effect.fail(
        new AuthorizationError({ message: "active organization required" }),
      )
    : Effect.succeed(session.activeOrganizationId);

export const adminOrganizationId = (session: Me) =>
  isAdmin(session)
    ? organizationId(session)
    : Effect.fail(new AuthorizationError({ message: "admin role required" }));

export const withOrganization = <A, E, R>(
  authService: AuthServiceImpl,
  useOrganization: (orgId: string) => Effect.Effect<A, E, R>,
) =>
  currentSession(authService).pipe(
    Effect.flatMap((session) => organizationId(session)),
    Effect.flatMap(useOrganization),
  );

export const withAdminOrganization = <A, E, R>(
  authService: AuthServiceImpl,
  useOrganization: (orgId: string) => Effect.Effect<A, E, R>,
) =>
  currentSession(authService).pipe(
    Effect.flatMap((session) => adminOrganizationId(session)),
    Effect.flatMap(useOrganization),
  );

export const withMemberSession = <A, E, R>(
  authService: AuthServiceImpl,
  useSession: (context: {
    readonly organizationId: string;
    readonly userId: string;
    readonly userName: string;
  }) => Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const session = yield* currentSession(authService);
    const orgId = yield* organizationId(session);
    return yield* useSession({
      organizationId: orgId,
      userId: session.userId,
      userName: session.userName,
    });
  });

export const withAdminSession = <A, E, R>(
  authService: AuthServiceImpl,
  useSession: (context: {
    readonly organizationId: string;
    readonly userId: string;
  }) => Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const session = yield* currentSession(authService);
    const orgId = yield* adminOrganizationId(session);
    return yield* useSession({ organizationId: orgId, userId: session.userId });
  });
