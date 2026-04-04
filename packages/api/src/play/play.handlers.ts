import { PlayService } from "@laxdb/core/play/play.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

export const PlaysHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Plays",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayService;

      return handlers
        .handle("listPlays", () => service.list())
        .handle("getPlay", ({ payload }) => service.get(payload))
        .handle("createPlay", ({ payload }) => service.create(payload))
        .handle("updatePlay", ({ payload }) => service.update(payload))
        .handle("deletePlay", ({ payload }) => service.delete(payload));
    }),
).pipe(Layer.provide(PlayService.layer));
