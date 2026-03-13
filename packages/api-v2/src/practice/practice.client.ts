import { Layer, ServiceMap } from "effect";
import { RpcClient } from "effect/unstable/rpc";

import { RpcProtocolLive } from "../protocol";

import { PracticeRpcs } from "./practice.rpc";

export class RpcPracticeClient extends ServiceMap.Service<RpcPracticeClient>()(
  "RpcPracticeClient",
  {
    make: RpcClient.make(PracticeRpcs),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(RpcProtocolLive),
  );
}
