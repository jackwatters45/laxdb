import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { TeamRpcs } from "./team.rpc";

export class RpcTeamClient extends Effect.Service<RpcTeamClient>()(
  "RpcTeamClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(TeamRpcs),
  },
) {}

export class RpcTeamClientAtom extends AtomRpc.Tag<RpcTeamClientAtom>()(
  "RpcTeamClientAtom",
  {
    group: TeamRpcs,
    protocol: RpcProtocolLive,
  },
) {}
