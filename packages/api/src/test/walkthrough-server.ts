/**
 * Local walkthrough server: serves the full HTTP API + Better Auth routes
 * against the Miniflare test D1, for driving the malvern app end-to-end in a
 * browser. Run with:
 *
 *   bun src/test/walkthrough-server.ts
 *
 * Magic links are printed to stdout (log-only email mode without a key).
 */
import { getTestD1Database, TestDatabaseLive } from "@laxdb/core/test/db";
import * as Cloudflare from "alchemy/Cloudflare";
import { DateTime, Effect, Layer } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { isAuthEnv, makeAuth } from "../auth/auth";
import { LaxdbApi } from "../definition";
import { HttpGroupsLive } from "../layers";

import { startNodeHttpTestServer } from "./http-test-server";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3005";

const env = {
  DB: await getTestD1Database(),
  BETTER_AUTH_SECRET: "walkthrough-local-secret-0123456789abcdef",
  BETTER_AUTH_URL: APP_ORIGIN,
  TRUSTED_ORIGINS: APP_ORIGIN,
};

const EnvLive = Layer.succeed(Cloudflare.WorkerEnvironment, env);

const HttpHandlers = HttpGroupsLive.pipe(
  Layer.provide(TestDatabaseLive),
  Layer.provide(EnvLive),
);

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApi).pipe(
  Layer.provide(HttpHandlers),
);

const AuthRoute = HttpRouter.use((router) =>
  router.add("*", "/api/auth/*", (request) =>
    Effect.gen(function* () {
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
);

const HealthRoute = HttpRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const AllRoutes = Layer.mergeAll(HttpApiRouter, AuthRoute, HealthRoute).pipe(
  Layer.provide(DateTime.layerCurrentZoneLocal),
);

const server = await startNodeHttpTestServer(AllRoutes);
console.log(`[walkthrough-api] listening at ${server.url}`);
