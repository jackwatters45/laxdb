import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayerRpcs } from "./player.rpc";

export const PlayerRpcHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return withRpcLogging({
      PlayerList: () => service.list(),
      PlayerGet: (payload) => service.getByPublicId(payload),
      PlayerCreate: (payload) => service.create(payload),
      PlayerUpdate: (payload) => service.update(payload),
      PlayerDelete: (payload) => service.delete(payload),
    });
  }),
).pipe(Layer.provide(PlayerService.layer));
