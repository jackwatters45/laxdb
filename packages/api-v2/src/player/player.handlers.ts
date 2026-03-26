import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

export const PlayersHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Players",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayerService;

      return handlers
        .handle("listPlayers", () => service.list())
        .handle("getPlayer", ({ payload }) => service.getByPublicId(payload))
        .handle("createPlayer", ({ payload }) => service.create(payload))
        .handle("updatePlayer", ({ payload }) => service.update(payload))
        .handle("deletePlayer", ({ payload }) => service.delete(payload));
    }),
).pipe(Layer.provide(PlayerService.layer));
