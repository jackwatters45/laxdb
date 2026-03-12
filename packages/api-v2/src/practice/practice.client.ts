import { RpcClient } from "@effect/rpc";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { PracticeRpcs } from "./practice.rpc";

export class RpcPracticeClient extends Effect.Service<RpcPracticeClient>()(
  "RpcPracticeClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(PracticeRpcs),
  },
) {}
