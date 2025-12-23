import {
  HttpApiBuilder,
  HttpApiScalar,
  HttpMiddleware,
  HttpServer,
  HttpServerResponse,
} from "@effect/platform";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { DateTime, Layer } from "effect";
import { AuthApiLive } from "./auth/auth.api";
import { AuthHandlers, AuthRpcs } from "./auth/auth.rpc";
import { GamesApiLive } from "./game/game.api";
import { GameHandlers, GameRpcs } from "./game/game.rpc";
import { OrganizationsApiLive } from "./organization/organization.api";
import {
  OrganizationHandlers,
  OrganizationRpcs,
} from "./organization/organization.rpc";
import { ContactInfoApiLive } from "./player/contact-info/contact-info.api";
import {
  ContactInfoHandlers,
  ContactInfoRpcs,
} from "./player/contact-info/contact-info.rpc";
import { PlayersApiLive } from "./player/player.api";
import { PlayerHandlers, PlayerRpcs } from "./player/player.rpc";
import { SeasonsApiLive } from "./season/season.api";
import { SeasonHandlers, SeasonRpcs } from "./season/season.rpc";
import { TeamsApiLive } from "./team/team.api";
import { TeamHandlers, TeamRpcs } from "./team/team.rpc";

const AllRpcs = Layer.mergeAll(
  RpcServer.layer(SeasonRpcs).pipe(Layer.provide(SeasonHandlers)),
  RpcServer.layer(GameRpcs).pipe(Layer.provide(GameHandlers)),
  RpcServer.layer(PlayerRpcs).pipe(Layer.provide(PlayerHandlers)),
  RpcServer.layer(ContactInfoRpcs).pipe(Layer.provide(ContactInfoHandlers)),
  RpcServer.layer(TeamRpcs).pipe(Layer.provide(TeamHandlers)),
  RpcServer.layer(OrganizationRpcs).pipe(Layer.provide(OrganizationHandlers)),
  RpcServer.layer(AuthRpcs).pipe(Layer.provide(AuthHandlers)),
);

const AllApis = Layer.mergeAll(
  SeasonsApiLive,
  GamesApiLive,
  PlayersApiLive,
  ContactInfoApiLive,
  AuthApiLive,
  OrganizationsApiLive,
  TeamsApiLive,
);

const RpcProtocol = RpcServer.layerProtocolHttp({
  path: "/rpc",
  routerTag: HttpApiBuilder.Router,
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

const HealthCheckRoute = HttpApiBuilder.Router.use((router) =>
  router.get("/health", HttpServerResponse.text("OK")),
);

const ApiLive = Layer.mergeAll(
  HttpServer.layerContext,
  HttpApiScalar.layer({ path: "/docs" }),
  HttpApiBuilder.middlewareCors({ allowedOrigins: ["*"] }),
  HttpApiBuilder.middlewareOpenApi(),
  AllApis,
  AllRpcs,
  RpcProtocol,
  HealthCheckRoute,
  DateTime.layerCurrentZoneLocal,
);

// @ts-expect-error
const { handler } = HttpApiBuilder.toWebHandler(ApiLive, {
  middleware: HttpMiddleware.logger,
});

export default { fetch: handler };
