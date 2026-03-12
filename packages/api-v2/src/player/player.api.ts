import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core-v2/error";
import { PlayerContract } from "@laxdb/core-v2/player/player.contract";

export const PlayersGroup = HttpApiGroup.make("Players")
  .add(
    HttpApiEndpoint.post("listPlayers", "/api/players")
      .addSuccess(PlayerContract.list.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError),
  )
  .add(
    HttpApiEndpoint.post("getPlayer", "/api/players/get")
      .addSuccess(PlayerContract.get.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PlayerContract.get.payload),
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
  );
