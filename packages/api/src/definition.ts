import { HttpApi } from "effect/unstable/httpapi";

import { DefaultsGroup } from "./defaults/defaults.api";
import { DrillsGroup } from "./drill/drill.api";
import { PlaysGroup } from "./play/play.api";
import { PlayersGroup } from "./player/player.api";
import { PracticesGroup } from "./practice/practice.api";

export class LaxdbApi extends HttpApi.make("LaxdbApi")
  .add(DefaultsGroup)
  .add(DrillsGroup)
  .add(PlaysGroup)
  .add(PlayersGroup)
  .add(PracticesGroup) {}
