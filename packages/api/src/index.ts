import { DateTime, Layer, ServiceMap } from "effect";
import {
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { LaxdbApiV2 } from "./definition";
import { HttpGroupsLive } from "./groups";
import { LaxdbRpcV2 } from "./rpc-group";
import { LaxdbRpcV2Handlers } from "./rpc-handlers";

const DocsRoute = HttpApiScalar.layer(LaxdbApiV2);

const RpcRouter = RpcServer.layerHttp({
  group: LaxdbRpcV2,
  path: "/rpc",
  protocol: "http",
  spanPrefix: "rpc",
}).pipe(
  Layer.provide(LaxdbRpcV2Handlers),
  Layer.provide(RpcSerialization.layerNdjson),
);

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApiV2).pipe(
  Layer.provide(HttpGroupsLive),
  Layer.provide(HttpServer.layerServices),
);

// oxlint-disable-next-line react-hooks/rules-of-hooks -- Not a React hook
const HealthCheckRoute = HttpRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const AllRoutes = Layer.mergeAll(
  RpcRouter,
  HttpApiRouter,
  DocsRoute,
  HealthCheckRoute,
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

/**
 * Build handler fresh per request.
 *
 * Workerd invalidates TCP sockets between request contexts. A cached handler
 * holds a pg Pool whose connections die after each request. Rebuilding per
 * request creates a fresh Pool each time. The actual perf cost is negligible —
 * Layer wiring is sub-ms; the DB round-trip (AU → US East) dominates.
 *
 * In production, Hyperdrive handles connection pooling at the network level,
 * so a fresh Pool per request just means a fresh Hyperdrive session.
 */
export default {
  fetch: (request: Request) => {
    const { handler, dispose } = HttpRouter.toWebHandler(AllRoutes);
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- empty request context satisfies handlers that don't require extra services at runtime
    const emptyContext = ServiceMap.empty() as ServiceMap.ServiceMap<unknown>;
    return handler(request, emptyContext).finally(() => {
      void dispose();
    });
  },
};
