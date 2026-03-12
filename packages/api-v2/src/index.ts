import {
  HttpApiScalar,
  HttpLayerRouter,
  HttpMiddleware,
  HttpServer,
  HttpServerResponse,
  OpenApi,
} from "@effect/platform";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { DateTime, Layer } from "effect";

import { LaxdbApiV2 } from "./definition";
import { HttpGroupsLive } from "./groups";
import { LaxdbRpcV2 } from "./rpc-group";
import { LaxdbRpcV2Handlers } from "./rpc-handlers";

const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
  api: LaxdbApiV2,
  path: "/docs",
});

const OpenApiJsonRoute = HttpLayerRouter.add(
  "GET",
  "/docs/openapi.json",
  HttpServerResponse.json(OpenApi.fromApi(LaxdbApiV2)),
).pipe(Layer.provide(HttpLayerRouter.layer));

const RpcRouter = RpcServer.layerHttpRouter({
  group: LaxdbRpcV2,
  path: "/rpc",
  protocol: "http",
  spanPrefix: "rpc",
}).pipe(
  Layer.provide(LaxdbRpcV2Handlers),
  Layer.provide(RpcSerialization.layerNdjson),
);

const HttpApiRouter = HttpLayerRouter.addHttpApi(LaxdbApiV2).pipe(
  Layer.provide(HttpGroupsLive),
  Layer.provide(HttpServer.layerContext),
);

// oxlint-disable-next-line react-hooks/rules-of-hooks -- Not a React hook
const HealthCheckRoute = HttpLayerRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const AllRoutes = Layer.mergeAll(
  RpcRouter,
  HttpApiRouter,
  DocsRoute,
  OpenApiJsonRoute,
  HealthCheckRoute,
  HttpLayerRouter.cors(),
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

const { handler } = HttpLayerRouter.toWebHandler(AllRoutes, {
  middleware: HttpMiddleware.logger,
});

export default { fetch: handler };
