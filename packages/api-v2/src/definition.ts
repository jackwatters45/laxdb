import { HttpApi } from "effect/unstable/httpapi";

import { DrillsGroup } from "./drill/drill.api";
import { PlayersGroup } from "./player/player.api";
import { PracticesGroup } from "./practice/practice.api";

export class LaxdbApiV2 extends HttpApi.make("LaxdbApiV2")
  .add(DrillsGroup)
  .add(PlayersGroup)
  .add(PracticesGroup) {}
