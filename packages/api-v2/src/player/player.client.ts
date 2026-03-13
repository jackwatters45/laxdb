import { Layer, ServiceMap } from "effect";
import { RpcClient } from "effect/unstable/rpc";

import { RpcProtocolLive } from "../protocol";

import { PlayerRpcs } from "./player.rpc";

export class RpcPlayerClient extends ServiceMap.Service<RpcPlayerClient>()(
  "RpcPlayerClient",
  {
    make: RpcClient.make(PlayerRpcs),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(RpcProtocolLive),
  );
}
