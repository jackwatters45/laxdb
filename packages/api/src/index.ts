import type { R2Bucket } from "@cloudflare/workers-types";
import { AuthService } from "@laxdb/core/auth/auth.service";
import {
  AuthenticationError,
  AuthorizationError,
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { MatchService } from "@laxdb/core/match/match.service";
import * as Cloudflare from "alchemy/Cloudflare";
import { DateTime, Redacted } from "effect";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServer from "effect/unstable/http/HttpServer";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";

import {
  currentSession,
  isAuthEnv,
  makeAuth,
  organizationId,
} from "./auth/auth";
import { LaxdbApi } from "./definition";
import { HttpGroups, ServicesLive } from "./layers";

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApi).pipe(
  Layer.provide(HttpGroups.pipe(Layer.provide(ServicesLive))),
);

const DocsRoute = HttpApiScalar.layer(LaxdbApi);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isR2Bucket = (value: unknown): value is R2Bucket =>
  isRecord(value) &&
  typeof value.put === "function" &&
  typeof value.get === "function" &&
  typeof value.delete === "function";

const matchImagesBucket = Effect.gen(function* () {
  const env = yield* Cloudflare.WorkerEnvironment;
  if (!isRecord(env) || !isR2Bucket(env.STORAGE)) {
    return yield* new DatabaseError({
      domain: "MatchImage",
      message: "R2 binding STORAGE is missing from api worker env",
    });
  }
  return env.STORAGE;
});

const errorResponse = (error: unknown) => {
  if (error instanceof AuthenticationError) {
    return HttpServerResponse.text(error.message, { status: 401 });
  }
  if (error instanceof AuthorizationError) {
    return HttpServerResponse.text(error.message, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return HttpServerResponse.text(error.message, { status: 404 });
  }
  if (error instanceof ValidationError) {
    return HttpServerResponse.text(error.message ?? "Invalid request", {
      status: 400,
    });
  }
  if (error instanceof DatabaseError) {
    return HttpServerResponse.text(error.message, { status: 500 });
  }
  return HttpServerResponse.text("Internal server error", { status: 500 });
};

// TODO(auth): review this raw Better Auth passthrough when auth is revisited.
// HttpApi covers schema-driven app endpoints; Better Auth still owns its own
// request/response protocol under /api/auth/*.
const AuthRoute = HttpRouter.use((router) =>
  router.add("*", "/api/auth/*", (request) =>
    Effect.gen(function* () {
      const env = yield* Cloudflare.WorkerEnvironment;
      const source = request.source;
      if (!isAuthEnv(env)) {
        return HttpServerResponse.text("Auth environment is invalid", {
          status: 500,
        });
      }
      if (!(source instanceof globalThis.Request)) {
        return HttpServerResponse.text("Unsupported request source", {
          status: 500,
        });
      }
      return HttpServerResponse.raw(
        yield* Effect.promise(async () => {
          const response = await makeAuth(env).handler(source);
          if (response.status >= 400) {
            const body = await response
              .clone()
              .text()
              .catch(() => "");
            console.log("[auth] failed", {
              method: source.method,
              url: source.url,
              status: response.status,
              origin: source.headers.get("origin"),
              referer: source.headers.get("referer"),
              hasCookie: source.headers.has("cookie"),
              body,
              baseURL: env.BETTER_AUTH_URL,
              trustedOrigins: env.TRUSTED_ORIGINS,
            });
          }
          return response;
        }),
      );
    }),
  ),
);

const RootRoute = HttpRouter.use((router) =>
  router.add("GET", "/", HttpServerResponse.text("OK")),
);

const HealthRoute = HttpRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const MatchImageRoute = HttpRouter.use((router) =>
  router.add(
    "GET",
    "/api/report-images/:id",
    Effect.gen(function* () {
      const params = yield* HttpRouter.params;
      const id = params.id;
      if (id === undefined || id === "") {
        return yield* new ValidationError({
          domain: "MatchImage",
          message: "Image id is required",
        });
      }

      const authService = yield* AuthService;
      const matchService = yield* MatchService;
      const session = yield* currentSession(authService);
      const orgId = yield* organizationId(session);
      const image = yield* matchService.getMatchImage({
        organizationId: orgId,
        id,
      });
      const bucket = yield* matchImagesBucket;
      const object = yield* Effect.tryPromise({
        try: () => bucket.get(image.objectKey),
        catch: (cause) =>
          new DatabaseError({
            domain: "MatchImage",
            message: "Failed to read image from R2",
            cause,
          }),
      });
      if (object === null) {
        return yield* new NotFoundError({ domain: "MatchImage", id });
      }
      return HttpServerResponse.raw(
        new Response(object.body, {
          headers: {
            "cache-control": "private, max-age=300",
            "content-type": image.contentType,
          },
        }),
      );
    }).pipe(
      Effect.provide(ServicesLive),
      Effect.catchTags({
        AuthenticationError: (error) => Effect.succeed(errorResponse(error)),
        AuthorizationError: (error) => Effect.succeed(errorResponse(error)),
        ConstraintViolationError: (error) =>
          Effect.succeed(errorResponse(error)),
        DatabaseError: (error) => Effect.succeed(errorResponse(error)),
        NotFoundError: (error) => Effect.succeed(errorResponse(error)),
        ValidationError: (error) => Effect.succeed(errorResponse(error)),
      }),
    ),
  ),
);

const routes = Layer.mergeAll(
  HttpApiRouter,
  DocsRoute,
  AuthRoute,
  RootRoute,
  HealthRoute,
  MatchImageRoute,
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

export const makeApiWorker = (env: Cloudflare.WorkerBindingProps = {}) =>
  Cloudflare.Worker(
    "api",
    {
      main: import.meta.filename,
      dev: {
        port: 1437,
        strictPort: true,
      },
      env: {
        // Sourced from Infisical at deploy time (`infisical run -- bun run deploy`).
        // Empty values keep EmailService in log-only mode.
        RESEND_API_KEY: Redacted.make(process.env.RESEND_API_KEY ?? ""),
        EMAIL_SENDER: process.env.EMAIL_SENDER ?? "",
        ...env,
      },
    },
    Effect.gen(function* () {
      return {
        fetch: routes.pipe(
          Layer.provide(HttpServer.layerServices),
          HttpRouter.toHttpEffect,
        ),
      };
    }),
  );

export default makeApiWorker();
