import { Layer } from "effect";

import { DrillsHandlersLive } from "../drill/drill.handlers";
import { PlayersHandlersLive } from "../player/player.handlers";
import { PracticesHandlersLive } from "../practice/practice.handlers";

export const HttpGroupsLive = Layer.mergeAll(
  DrillsHandlersLive,
  PlayersHandlersLive,
  PracticesHandlersLive,
);
