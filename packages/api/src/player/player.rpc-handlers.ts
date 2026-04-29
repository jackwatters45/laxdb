import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayerRpcs } from "./player.rpc";

export const PlayerRpcHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return withRpcLogging({
      PlayerList: service.list,
      PlayerGet: service.getByPublicId,
      PlayerCreate: service.create,
      PlayerUpdate: service.update,
      PlayerDelete: service.delete,
    });
  }),
).pipe(Layer.provide(PlayerService.layer));
