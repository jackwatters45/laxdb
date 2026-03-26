import { DatabaseLive } from "@laxdb/core-v2/drizzle/drizzle.service";
import { Layer } from "effect";

import { DrillRpcHandlers } from "./drill/drill.rpc-handlers";
import { PlayerRpcHandlers } from "./player/player.rpc-handlers";
import { PracticeRpcHandlers } from "./practice/practice.rpc-handlers";

export const LaxdbRpcV2Handlers = Layer.mergeAll(
  DrillRpcHandlers,
  PlayerRpcHandlers,
  PracticeRpcHandlers,
).pipe(Layer.provide(DatabaseLive));
