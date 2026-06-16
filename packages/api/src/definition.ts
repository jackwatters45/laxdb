import { HttpApi } from "effect/unstable/httpapi";

import { AuthGroup } from "./auth/auth.api";
import { ClubGroup } from "./club/club.api";
import { DefaultsGroup } from "./defaults/defaults.api";
import { DrillsGroup } from "./drill/drill.api";
import { FinesGroup } from "./fine/fines.api";
import { MatchesGroup } from "./match/match.api";
import { PlaysGroup } from "./play/play.api";
import { PlayersGroup } from "./player/player.api";
import { PracticesGroup } from "./practice/practice.api";

export class LaxdbApi extends HttpApi.make("LaxdbApi")
  .add(AuthGroup)
  .add(ClubGroup)
  .add(DefaultsGroup)
  .add(DrillsGroup)
  .add(FinesGroup)
  .add(MatchesGroup)
  .add(PlaysGroup)
  .add(PlayersGroup)
  .add(PracticesGroup) {}
