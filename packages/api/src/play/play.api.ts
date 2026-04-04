import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PlayContract } from "@laxdb/core/play/play.contract";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export const PlaysGroup = HttpApiGroup.make("Plays")
  .add(
    HttpApiEndpoint.post("listPlays", "/api/plays", {
      success: PlayContract.list.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.post("getPlay", "/api/plays/get", {
      success: PlayContract.get.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayContract.get.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("createPlay", "/api/plays/create", {
      success: PlayContract.create.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayContract.create.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("updatePlay", "/api/plays/update", {
      success: PlayContract.update.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayContract.update.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("deletePlay", "/api/plays/delete", {
      success: PlayContract.delete.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: PlayContract.delete.payload,
    }),
  );
