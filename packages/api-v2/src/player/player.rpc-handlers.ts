import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { Effect, Layer } from "effect";

import { PlayerRpcs } from "./player.rpc";

export const PlayerRpcHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return {
      PlayerList: () => service.list(),
      PlayerGet: (payload) => service.getByPublicId(payload),
      PlayerCreate: (payload) => service.create(payload),
      PlayerUpdate: (payload) => service.update(payload),
      PlayerDelete: (payload) => service.delete(payload),
    };
  }),
).pipe(Layer.provide(PlayerService.layer));
