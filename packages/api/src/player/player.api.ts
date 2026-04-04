import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PlayerContract } from "@laxdb/core/player/player.contract";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export const PlayersGroup = HttpApiGroup.make("Players")
  .add(
    HttpApiEndpoint.post("listPlayers", "/api/players", {
      success: PlayerContract.list.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.post("getPlayer", "/api/players/get", {
      success: PlayerContract.get.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayerContract.get.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("createPlayer", "/api/players/create", {
      success: PlayerContract.create.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayerContract.create.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("updatePlayer", "/api/players/update", {
      success: PlayerContract.update.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayerContract.update.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("deletePlayer", "/api/players/delete", {
      success: PlayerContract.delete.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayerContract.delete.payload,
    }),
  );
