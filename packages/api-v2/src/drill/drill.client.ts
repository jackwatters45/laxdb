import { Layer, ServiceMap } from "effect";
import { RpcClient } from "effect/unstable/rpc";

import { RpcProtocolLive } from "../protocol";

import { DrillRpcs } from "./drill.rpc";

export class RpcDrillClient extends ServiceMap.Service<RpcDrillClient>()(
  "RpcDrillClient",
  {
    make: RpcClient.make(DrillRpcs),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(RpcProtocolLive),
  );
}
