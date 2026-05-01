import { DateTime, Layer } from "effect";
import {
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { LaxdbApiV2 } from "./definition";
import { HttpGroupsLive } from "./groups";
import { emptyRequestContext } from "./request-context";
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
 * The Effect layer graph is cheap to construct and keeps request-scoped
 * resources isolated. D1 is a Cloudflare binding, so there are no TCP pools or
 * connection lifetimes to manage.
 */
export default {
  fetch: async (request: Request) => {
    const { handler, dispose } = HttpRouter.toWebHandler(AllRoutes);
    try {
      return await handler(request, emptyRequestContext);
    } finally {
      await dispose();
    }
  },
};
