import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

import { PlayerOperations } from "./player.operations";

export const PlayersHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Players",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayerService;

      return handlers
        .handle(PlayerOperations.list.httpName, () => service.list())
        .handle(PlayerOperations.get.httpName, ({ payload }) =>
          service.getByPublicId(payload),
        )
        .handle(PlayerOperations.create.httpName, ({ payload }) =>
          service.create(payload),
        )
        .handle(PlayerOperations.update.httpName, ({ payload }) =>
          service.update(payload),
        )
        .handle(PlayerOperations.delete.httpName, ({ payload }) =>
          service.delete(payload),
        );
    }),
).pipe(Layer.provide(PlayerService.layer));
