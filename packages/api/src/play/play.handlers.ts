import { PlayService } from "@laxdb/core/play/play.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

import { PlayOperations } from "./play.operations";

export const PlaysHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Plays",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayService;

      return handlers
        .handle(PlayOperations.list.httpName, () => service.list())
        .handle(PlayOperations.get.httpName, ({ payload }) =>
          service.get(payload),
        )
        .handle(PlayOperations.create.httpName, ({ payload }) =>
          service.create(payload),
        )
        .handle(PlayOperations.update.httpName, ({ payload }) =>
          service.update(payload),
        )
        .handle(PlayOperations.delete.httpName, ({ payload }) =>
          service.delete(payload),
        );
    }),
).pipe(Layer.provide(PlayService.layer));
