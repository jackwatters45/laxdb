import { RpcGroup } from "effect/unstable/rpc";

import { DrillRpcs } from "./drill/drill.rpc";
import { PlayerRpcs } from "./player/player.rpc";
import { PracticeRpcs } from "./practice/practice.rpc";

export class LaxdbRpcV2 extends RpcGroup.make()
  .merge(DrillRpcs)
  .merge(PlayerRpcs)
  .merge(PracticeRpcs) {}
