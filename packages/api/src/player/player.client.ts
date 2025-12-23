import { FetchHttpClient } from "@effect/platform";
import { RpcClient } from "@effect/rpc";
import { AtomHttpApi, AtomRpc } from "@effect-atom/atom-react";
import { Effect } from "effect";
import { RpcProtocolLive } from "../protocol";
import { PlayersApi } from "./player.api";
import { PlayerRpcs } from "./player.rpc";

export class RpcPlayerClient extends Effect.Service<RpcPlayerClient>()(
  "RpcPlayerClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(PlayerRpcs),
  },
) {}

export class RpcPlayerClientAtom extends AtomRpc.Tag<RpcPlayerClientAtom>()(
  "RpcPlayerClientAtom",
  {
    group: PlayerRpcs,
    protocol: RpcProtocolLive,
  },
) {}

export class HttpPlayerClientAtom extends AtomHttpApi.Tag<HttpPlayerClientAtom>()(
  "HttpPlayerClientAtom",
  {
    api: PlayersApi,
    httpClient: FetchHttpClient.layer,
    baseUrl: process.env.API_URL!,
  },
) {}
