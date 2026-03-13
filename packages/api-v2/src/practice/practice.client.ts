import { Layer, ServiceMap } from "effect";
import { RpcClient } from "effect/unstable/rpc";

import { PracticeRpcs } from "./practice.rpc";

export class RpcPracticeClient extends ServiceMap.Service<RpcPracticeClient>()(
  "RpcPracticeClient",
  {
    make: RpcClient.make(PracticeRpcs),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
