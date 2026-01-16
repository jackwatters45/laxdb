import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { GameContract } from "@laxdb/core/game/game.contract";

// Group definition - no LaxdbApi import
export const GamesGroup = HttpApiGroup.make("Games")
  .add(
    HttpApiEndpoint.post("listGames", "/api/games")
      .addSuccess(GameContract.list.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(GameContract.list.payload),
  )
  .add(
    HttpApiEndpoint.post("getGame", "/api/games/get")
      .addSuccess(GameContract.get.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(GameContract.get.payload),
  )
  .add(
    HttpApiEndpoint.post("createGame", "/api/games/create")
      .addSuccess(GameContract.create.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(GameContract.create.payload),
  )
  .add(
    HttpApiEndpoint.post("updateGame", "/api/games/update")
      .addSuccess(GameContract.update.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(GameContract.update.payload),
  )
  .add(
    HttpApiEndpoint.post("deleteGame", "/api/games/delete")
      .addSuccess(GameContract.delete.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(GameContract.delete.payload),
  );

