import { DatabaseLive } from "@laxdb/core-v2/drizzle/drizzle.service";
import { Layer } from "effect";

import { DrillHandlers } from "./drill/drill.rpc";
import { PlayerHandlers } from "./player/player.rpc";
import { PracticeHandlers } from "./practice/practice.rpc";

export const LaxdbRpcV2Handlers = Layer.mergeAll(
  DrillHandlers,
  PlayerHandlers,
  PracticeHandlers,
).pipe(Layer.provide(DatabaseLive));
