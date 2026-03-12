import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { PlayerRpcs } from "./player.rpc";

export class RpcPlayerClient extends Effect.Service<RpcPlayerClient>()(
  "RpcPlayerClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(PlayerRpcs),
  },
) {}
