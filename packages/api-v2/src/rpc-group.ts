import { RpcGroup } from "effect/unstable/rpc";

import { DefaultsRpcs } from "./defaults/defaults.rpc";
import { DrillRpcs } from "./drill/drill.rpc";
import { PlayRpcs } from "./play/play.rpc";
import { PlayerRpcs } from "./player/player.rpc";
import { PracticeRpcs } from "./practice/practice.rpc";

export class LaxdbRpcV2 extends RpcGroup.make()
  .merge(DefaultsRpcs)
  .merge(DrillRpcs)
  .merge(PlayRpcs)
  .merge(PlayerRpcs)
  .merge(PracticeRpcs) {}
