import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { DrillRpcs } from "./drill.rpc";

export class RpcDrillClient extends Effect.Service<RpcDrillClient>()(
  "RpcDrillClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(DrillRpcs),
  },
) {}
