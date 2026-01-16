import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PlayerContract } from "@laxdb/core/player/player.contract";

// Group definition - no LaxdbApi import
export const PlayersGroup = HttpApiGroup.make("Players")
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
    HttpApiEndpoint.post("removePlayerFromTeam", "/api/players/remove-from-team")
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
  );

