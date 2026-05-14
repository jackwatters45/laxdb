import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApi } from "../definition";

export const PlayersHandlers = HttpApiBuilder.group(
  LaxdbApi,
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
);
