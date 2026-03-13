import { Layer, ServiceMap } from "effect";
import { RpcClient } from "effect/unstable/rpc";

import { PlayerRpcs } from "./player.rpc";

export class RpcPlayerClient extends ServiceMap.Service<RpcPlayerClient>()(
  "RpcPlayerClient",
  {
    make: RpcClient.make(PlayerRpcs),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
