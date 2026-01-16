import {
  HttpLayerRouter,
  HttpMiddleware,
  HttpServer,
  HttpServerResponse,
} from "@effect/platform";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { DateTime, Layer } from "effect";

import { LaxdbApi } from "./definition";
import { HttpGroupsLive } from "./groups";
import { LaxdbRpc } from "./rpc-group";
import { LaxdbRpcHandlers } from "./rpc-handlers";

const RpcRouter = RpcServer.layerHttpRouter({
  group: LaxdbRpc,
  path: "/rpc",
  protocol: "http",
  spanPrefix: "rpc",
}).pipe(
  Layer.provide(LaxdbRpcHandlers),
  Layer.provide(RpcSerialization.layerNdjson),
);

const HttpApiRouter = HttpLayerRouter.addHttpApi(LaxdbApi).pipe(
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
  HealthCheckRoute,
  HttpLayerRouter.cors(),
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

const { handler } = HttpLayerRouter.toWebHandler(AllRoutes, {
  middleware: HttpMiddleware.logger,
});

export default { fetch: handler };
