import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../../protocol";

import { ContactInfoRpcs } from "./contact-info.rpc";

export class RpcContactInfoClient extends Effect.Service<RpcContactInfoClient>()(
  "RpcContactInfoClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(ContactInfoRpcs),
  },
) {}

export class RpcContactInfoClientAtom extends AtomRpc.Tag<RpcContactInfoClientAtom>()(
  "RpcContactInfoClientAtom",
  {
    group: ContactInfoRpcs,
    protocol: RpcProtocolLive,
  },
) {}
