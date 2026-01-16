import { HttpApiBuilder } from "@effect/platform";
import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect, Layer } from "effect";
import { LaxdbApi } from "../definition";

// Handler implementation using LaxdbApi
export const PlayersHandlersLive = HttpApiBuilder.group(
  LaxdbApi,
  "Players",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayerService;

      return handlers
        .handle("listPlayers", ({ payload }) => service.getAll(payload))
        .handle("createPlayer", ({ payload }) => service.create(payload))
        .handle("updatePlayer", ({ payload }) => service.updatePlayer(payload))
        .handle("deletePlayer", ({ payload }) => service.deletePlayer(payload))
        .handle("bulkDeletePlayers", ({ payload }) =>
          service.bulkDeletePlayers(payload),
        )
        .handle("getTeamPlayers", ({ payload }) =>
          service.getTeamPlayers(payload),
        )
        .handle("addPlayerToTeam", ({ payload }) =>
          service.addPlayerToTeam(payload),
        )
        .handle("updateTeamPlayer", ({ payload }) =>
          service.updateTeamPlayer(payload),
        )
        .handle("removePlayerFromTeam", ({ payload }) =>
          service.removePlayerFromTeam(payload),
        )
        .handle("bulkRemovePlayersFromTeam", ({ payload }) =>
          service.bulkRemovePlayersFromTeam(payload),
        );
    }),
).pipe(Layer.provide(PlayerService.Default));
