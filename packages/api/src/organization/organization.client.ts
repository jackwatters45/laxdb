import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { OrganizationRpcs } from "./organization.rpc";

export class RpcOrganizationClient extends Effect.Service<RpcOrganizationClient>()(
  "RpcOrganizationClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(OrganizationRpcs),
  },
) {}

export class RpcOrganizationClientAtom extends AtomRpc.Tag<RpcOrganizationClientAtom>()(
  "RpcOrganizationClientAtom",
  {
    group: OrganizationRpcs,
    protocol: RpcProtocolLive,
  },
) {}
