import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PlayerContract } from "@laxdb/core/player/player.contract";
import { PlayerService } from "@laxdb/core/player/player.service";
import { Effect, Layer } from "effect";

export const PlayersApi = HttpApi.make("PlayersApi").add(
  HttpApiGroup.make("Players")
    .add(
      HttpApiEndpoint.post("listPlayers", "/api/players")
        .addSuccess(PlayerContract.list.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.list.payload),
    )
    .add(
      HttpApiEndpoint.post("createPlayer", "/api/players/create")
        .addSuccess(PlayerContract.create.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.create.payload),
    )
    .add(
      HttpApiEndpoint.post("updatePlayer", "/api/players/update")
        .addSuccess(PlayerContract.update.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.update.payload),
    )
    .add(
      HttpApiEndpoint.post("deletePlayer", "/api/players/delete")
        .addSuccess(PlayerContract.delete.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.delete.payload),
    )
    .add(
      HttpApiEndpoint.post("bulkDeletePlayers", "/api/players/bulk-delete")
        .addSuccess(PlayerContract.bulkDelete.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.bulkDelete.payload),
    )
    .add(
      HttpApiEndpoint.post("getTeamPlayers", "/api/players/team")
        .addSuccess(PlayerContract.getTeamPlayers.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.getTeamPlayers.payload),
    )
    .add(
      HttpApiEndpoint.post("addPlayerToTeam", "/api/players/add-to-team")
        .addSuccess(PlayerContract.addPlayerToTeam.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.addPlayerToTeam.payload),
    )
    .add(
      HttpApiEndpoint.post("updateTeamPlayer", "/api/players/update-team")
        .addSuccess(PlayerContract.updateTeamPlayer.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.updateTeamPlayer.payload),
    )
    .add(
      HttpApiEndpoint.post(
        "removePlayerFromTeam",
        "/api/players/remove-from-team",
      )
        .addSuccess(PlayerContract.removePlayerFromTeam.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.removePlayerFromTeam.payload),
    )
    .add(
      HttpApiEndpoint.post(
        "bulkRemovePlayersFromTeam",
        "/api/players/bulk-remove-from-team",
      )
        .addSuccess(PlayerContract.bulkRemovePlayersFromTeam.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(PlayerContract.bulkRemovePlayersFromTeam.payload),
    ),
);

const PlayersApiHandlers = HttpApiBuilder.group(
  PlayersApi,
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

export const PlayersApiLive = HttpApiBuilder.api(PlayersApi).pipe(
  Layer.provide(PlayersApiHandlers),
);
