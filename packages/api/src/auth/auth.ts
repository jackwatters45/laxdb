import type { D1Database } from "@cloudflare/workers-types";
import { createAuth, type Auth } from "@laxdb/core/auth/auth";
import type { Me } from "@laxdb/core/auth/auth.schema";
import type { AuthService } from "@laxdb/core/auth/auth.service";
import { AuthenticationError, AuthorizationError } from "@laxdb/core/error";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";

export type AuthEnv = {
  readonly DB: D1Database;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly TRUSTED_ORIGINS?: string;
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

// TODO(auth): this is a direct lift from the fines prototype. Rework into a
// shared auth service/layer before expanding auth beyond the fines app.
export const makeAuth = (env: AuthEnv): Auth =>
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
