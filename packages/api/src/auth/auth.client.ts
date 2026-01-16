import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { AuthRpcs } from "./auth.rpc";

export class RpcAuthClient extends Effect.Service<RpcAuthClient>()(
  "RpcAuthClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(AuthRpcs),
  },
) {}

export class RpcAuthClientAtom extends AtomRpc.Tag<RpcAuthClientAtom>()(
  "RpcAuthClientAtom",
  {
    group: AuthRpcs,
    protocol: RpcProtocolLive,
  },
) {}
