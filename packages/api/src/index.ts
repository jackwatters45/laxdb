import * as Cloudflare from "alchemy/Cloudflare";
import { DateTime } from "effect";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";

import { LaxdbApi } from "./definition";
import { HttpGroups, ServicesLive } from "./layers";

const routes = Layer.mergeAll(
  HttpApiBuilder.layer(LaxdbApi).pipe(
    Layer.provide(HttpGroups.pipe(Layer.provide(ServicesLive))),
  ),
  HttpApiScalar.layer(LaxdbApi),
  HttpRouter.use((router) =>
    router.add("GET", "/health", HttpServerResponse.text("OK")),
  ),
).pipe(Layer.provide(DateTime.layerCurrentZoneLocal));

export default Cloudflare.Worker(
  "api",
  { main: import.meta.filename },
  Effect.gen(function* () {
    return {
      fetch: routes.pipe(
        Layer.provide([HttpPlatform.layer, Etag.layer]),
        HttpRouter.toHttpEffect,
      ),
    };
  }),
);
