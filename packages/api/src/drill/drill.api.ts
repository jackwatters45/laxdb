import { DrillContract } from "@laxdb/core/drill/drill.contract";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export const DrillsGroup = HttpApiGroup.make("Drills")
  .add(
    HttpApiEndpoint.post("listDrills", "/api/drills", {
      success: DrillContract.list.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.post("getDrill", "/api/drills/get", {
      success: DrillContract.get.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: Schema.toEncoded(DrillContract.get.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("createDrill", "/api/drills/create", {
      success: DrillContract.create.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: Schema.toEncoded(DrillContract.create.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("updateDrill", "/api/drills/update", {
      success: DrillContract.update.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: Schema.toEncoded(DrillContract.update.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("deleteDrill", "/api/drills/delete", {
      success: DrillContract.delete.success,
      error: [
        NotFoundError,
        ValidationError,
        DatabaseError,
        ConstraintViolationError,
      ],
      payload: Schema.toEncoded(DrillContract.delete.payload),
    }),
  );
