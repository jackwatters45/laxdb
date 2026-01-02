import { FetchHttpClient } from "@effect/platform";
import { RpcClient } from "@effect/rpc";
import { AtomHttpApi, AtomRpc } from "@effect-atom/atom-react";
import { Env } from "@laxdb/core/config";
import { Effect } from "effect";
import { RpcProtocolLive } from "../protocol";
import { SeasonsApi } from "./season.api";
import { SeasonRpcs } from "./season.rpc";

export class RpcSeasonClient extends Effect.Service<RpcSeasonClient>()(
  "RpcSeasonClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(SeasonRpcs),
  },
) {}

export class RpcSeasonClientAtom extends AtomRpc.Tag<RpcSeasonClientAtom>()(
  "RpcSeasonClientAtom",
  {
    group: SeasonRpcs,
    protocol: RpcProtocolLive,
  },
) {}

export class HttpSeasonClientAtom extends AtomHttpApi.Tag<HttpSeasonClientAtom>()(
  "HttpSeasonClientAtom",
  {
    api: SeasonsApi,
    httpClient: FetchHttpClient.layer,
    baseUrl: Env.API_URL(),
  },
) {}
