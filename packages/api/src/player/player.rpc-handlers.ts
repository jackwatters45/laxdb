import type {
  CreatePlayerInput,
  PlayerByIdInput,
  UpdatePlayerInput,
} from "@laxdb/core/player/player.schema";
import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayerRpcs } from "./player.rpc";

export const PlayerRpcHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return withRpcLogging({
      PlayerList: () => service.list(),
      PlayerGet: (payload: PlayerByIdInput) => service.getByPublicId(payload),
      PlayerCreate: (payload: CreatePlayerInput) => service.create(payload),
      PlayerUpdate: (payload: UpdatePlayerInput) => service.update(payload),
      PlayerDelete: (payload: PlayerByIdInput) => service.delete(payload),
    });
  }),
).pipe(Layer.provide(PlayerService.layer));
