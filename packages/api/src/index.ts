import * as Cloudflare from "alchemy/Cloudflare";
import { DateTime, Redacted } from "effect";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServer from "effect/unstable/http/HttpServer";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";

import { isAuthEnv, makeAuth } from "./auth/auth";
import { LaxdbApi } from "./definition";
import { HttpGroups, ServicesLive } from "./layers";

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApi).pipe(
  Layer.provide(HttpGroups.pipe(Layer.provide(ServicesLive))),
);

const DocsRoute = HttpApiScalar.layer(LaxdbApi);

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

const routes = Layer.mergeAll(
  HttpApiRouter,
  DocsRoute,
  AuthRoute,
  RootRoute,
  HealthRoute,
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

export const makeApiWorker = (env: Cloudflare.WorkerBindingProps = {}) =>
  Cloudflare.Worker(
    "api",
    {
      main: import.meta.filename,
      dev: {
        port: 1337,
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
