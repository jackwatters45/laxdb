import { HttpApiBuilder } from "@effect/platform";
import { GameService } from "@laxdb/core/game/game.service";
import { Effect, Layer } from "effect";

import { LaxdbApi } from "../definition";

// Handler implementation using LaxdbApi
export const GamesHandlersLive = HttpApiBuilder.group(
  LaxdbApi,
  "Games",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* GameService;

      return handlers
        .handle("listGames", ({ payload }) => service.list(payload))
        .handle("getGame", ({ payload }) => service.get(payload))
        .handle("createGame", ({ payload }) => service.create(payload))
        .handle("updateGame", ({ payload }) => service.update(payload))
        .handle("deleteGame", ({ payload }) => service.delete(payload));
    }),
).pipe(Layer.provide(GameService.Default));
