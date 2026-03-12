import { Layer } from "effect";

import { RpcDrillClient } from "./drill/drill.client";
import { RpcPlayerClient } from "./player/player.client";
import { RpcPracticeClient } from "./practice/practice.client";

export const RpcClientLive = Layer.mergeAll(
  RpcDrillClient.Default,
  RpcPlayerClient.Default,
  RpcPracticeClient.Default,
);
