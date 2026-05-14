import { Layer } from "effect";

import { DefaultsHandlersLive } from "../defaults/defaults.handlers";
import { DrillsHandlersLive } from "../drill/drill.handlers";
import { PlaysHandlersLive } from "../play/play.handlers";
import { PlayersHandlersLive } from "../player/player.handlers";
import { PracticesHandlersLive } from "../practice/practice.handlers";

export const HttpGroupsLive = Layer.mergeAll(
  DefaultsHandlersLive,
  DrillsHandlersLive,
  PlaysHandlersLive,
  PlayersHandlersLive,
  PracticesHandlersLive,
);
