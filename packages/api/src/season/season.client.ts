import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

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
