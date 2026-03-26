import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";
import { asPlayer } from "../lib/mappers";

export const PlayersHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Players",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayerService;

      return handlers
        .handle("listPlayers", () =>
          service.list().pipe(Effect.map((rows) => rows.map(asPlayer))),
        )
        .handle("getPlayer", ({ payload }) =>
          service.getByPublicId(payload).pipe(Effect.map(asPlayer)),
        )
        .handle("createPlayer", ({ payload }) =>
          service.create(payload).pipe(Effect.map(asPlayer)),
        )
        .handle("updatePlayer", ({ payload }) =>
          service.update(payload).pipe(Effect.map(asPlayer)),
        )
        .handle("deletePlayer", ({ payload }) =>
          service.delete(payload).pipe(Effect.map(asPlayer)),
        );
    }),
).pipe(Layer.provide(PlayerService.layer));
