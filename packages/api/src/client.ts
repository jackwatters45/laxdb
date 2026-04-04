import { Layer, ServiceMap } from "effect";
import { RpcClient } from "effect/unstable/rpc";

import { LaxdbRpcV2 } from "./rpc-group";

/**
 * Single RPC client for all api groups (Drill, Player, Practice).
 *
 * Uses one RpcClient.make with the merged group — mirrors the server's
 * single RpcServer.layerHttp({ group: LaxdbRpcV2 }). This is required
 * because each RpcClient.make call needs its own Protocol (withRun's
 * semaphore only allows one active `run` callback).
 */
export class RpcApiClient extends ServiceMap.Service<RpcApiClient>()(
  "RpcApiClient",
  {
    make: RpcClient.make(LaxdbRpcV2),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
