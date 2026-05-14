import { PlayService } from "@laxdb/core/play/play.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApi } from "../definition";

export const PlaysHandlers = HttpApiBuilder.group(
  LaxdbApi,
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
);
