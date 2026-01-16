import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { GameRpcs } from "./game.rpc";

export class RpcGameClient extends Effect.Service<RpcGameClient>()(
  "RpcGameClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(GameRpcs),
  },
) {}

export class RpcGameClientAtom extends AtomRpc.Tag<RpcGameClientAtom>()(
  "RpcGameClientAtom",
  {
    group: GameRpcs,
    protocol: RpcProtocolLive,
  },
) {}
