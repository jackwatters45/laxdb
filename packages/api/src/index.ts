import * as Cloudflare from "alchemy/Cloudflare";
import { DateTime, Redacted } from "effect";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";

import { isAuthEnv, makeAuth } from "./auth/auth";
import { LaxdbApi } from "./definition";
import { HttpGroups, ServicesLive } from "./layers";

const routes = Layer.mergeAll(
  HttpApiBuilder.layer(LaxdbApi).pipe(
    Layer.provide(HttpGroups.pipe(Layer.provide(ServicesLive))),
  ),
  HttpApiScalar.layer(LaxdbApi),
  // TODO(auth): review this raw Better Auth passthrough when auth is revisited.
  // HttpApi covers schema-driven app endpoints; Better Auth still owns its own
  // request/response protocol under /api/auth/*.
  HttpRouter.use((router) =>
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
          yield* Effect.promise(() => makeAuth(env).handler(source)),
        );
      }),
    ),
  ),
  HttpRouter.use((router) =>
    router.add("GET", "/health", HttpServerResponse.text("OK")),
  ),
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

export default Cloudflare.Worker(
  "api",
  {
    main: import.meta.filename,
    env: {
      // Sourced from Infisical at deploy time (`infisical run -- bun run deploy`).
      // Empty values keep EmailService in log-only mode.
      RESEND_API_KEY: Redacted.make(process.env.RESEND_API_KEY ?? ""),
      EMAIL_SENDER: process.env.EMAIL_SENDER ?? "",
    },
  },
  Effect.gen(function* () {
    return {
      fetch: routes.pipe(
        Layer.provide([HttpPlatform.layer, Etag.layer]),
        HttpRouter.toHttpEffect,
      ),
    };
  }),
);
