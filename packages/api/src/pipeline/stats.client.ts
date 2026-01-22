import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { StatsRpcs } from "./stats.rpc";

export class RpcStatsClient extends Effect.Service<RpcStatsClient>()(
  "RpcStatsClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(StatsRpcs),
  },
) {}

export class RpcStatsClientAtom extends AtomRpc.Tag<RpcStatsClientAtom>()(
  "RpcStatsClientAtom",
  {
    group: StatsRpcs,
    protocol: RpcProtocolLive,
  },
) {}
