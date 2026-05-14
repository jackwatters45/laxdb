import { DatabaseLiveFromBinding } from "@laxdb/core/drizzle/drizzle.service";
import { DateTime, Layer } from "effect";
import {
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import type { ApiWorkerEnv } from "../../../alchemy.run";

import { LaxdbApiV2 } from "./definition";
import { HttpGroupsLive } from "./groups";
import { emptyRequestContext } from "./request-context";

const DocsRoute = HttpApiScalar.layer(LaxdbApiV2);

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApiV2).pipe(
  Layer.provide(HttpGroupsLive),
  Layer.provide(HttpServer.layerServices),
);

// oxlint-disable-next-line react-hooks/rules-of-hooks -- Not a React hook
const HealthCheckRoute = HttpRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const AllRoutes = Layer.mergeAll(
  HttpApiRouter,
  DocsRoute,
  HealthCheckRoute,
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

const routesForEnv = (env: ApiWorkerEnv) =>
  AllRoutes.pipe(Layer.provide(DatabaseLiveFromBinding(env.DB)));

/**
 * Build handler fresh per request.
 *
 * The Effect layer graph is cheap to construct and keeps request-scoped
 * resources isolated. D1 is a Cloudflare binding, so there are no TCP pools or
 * connection lifetimes to manage.
 */
export default {
  fetch: async (request: Request, env: ApiWorkerEnv) => {
    const { handler, dispose } = HttpRouter.toWebHandler(routesForEnv(env));
    try {
      return await handler(request, emptyRequestContext);
    } finally {
      await dispose();
    }
  },
};
