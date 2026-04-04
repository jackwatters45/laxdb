import { DatabaseLive } from "@laxdb/core-v2/drizzle/drizzle.service";
import { Layer } from "effect";

import { DrillsHandlersLive } from "../drill/drill.handlers";
import { PlaysHandlersLive } from "../play/play.handlers";
import { PlayersHandlersLive } from "../player/player.handlers";
import { PracticesHandlersLive } from "../practice/practice.handlers";

export const HttpGroupsLive = Layer.mergeAll(
  DrillsHandlersLive,
  PlaysHandlersLive,
  PlayersHandlersLive,
  PracticesHandlersLive,
).pipe(Layer.provide(DatabaseLive));
