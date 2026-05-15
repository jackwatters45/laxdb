import { HttpApi } from "effect/unstable/httpapi";

import { AuthGroup } from "./auth/auth.api";
import { DefaultsGroup } from "./defaults/defaults.api";
import { DrillsGroup } from "./drill/drill.api";
import { FinesGroup } from "./fine/fines.api";
import { PlaysGroup } from "./play/play.api";
import { PlayersGroup } from "./player/player.api";
import { PracticesGroup } from "./practice/practice.api";

export class LaxdbApi extends HttpApi.make("LaxdbApi")
  .add(AuthGroup)
  .add(DefaultsGroup)
  .add(DrillsGroup)
  .add(FinesGroup)
  .add(PlaysGroup)
  .add(PlayersGroup)
  .add(PracticesGroup) {}
