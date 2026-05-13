import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayerOperations } from "./player.operations";
import { PlayerRpcs } from "./player.rpc";

export const PlayerRpcHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return withRpcLogging({
      [PlayerOperations.list.rpcName]: service.list,
      [PlayerOperations.get.rpcName]: service.getByPublicId,
      [PlayerOperations.create.rpcName]: service.create,
      [PlayerOperations.update.rpcName]: service.update,
      [PlayerOperations.delete.rpcName]: service.delete,
    });
  }),
).pipe(Layer.provide(PlayerService.layer));
