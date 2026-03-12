import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { DrillContract } from "@laxdb/core-v2/drill/drill.contract";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core-v2/error";

export const DrillsGroup = HttpApiGroup.make("Drills")
  .add(
    HttpApiEndpoint.post("listDrills", "/api/drills")
      .addSuccess(DrillContract.list.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError),
  )
  .add(
    HttpApiEndpoint.post("getDrill", "/api/drills/get")
      .addSuccess(DrillContract.get.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(DrillContract.get.payload),
  )
  .add(
    HttpApiEndpoint.post("createDrill", "/api/drills/create")
      .addSuccess(DrillContract.create.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(DrillContract.create.payload),
  )
  .add(
    HttpApiEndpoint.post("updateDrill", "/api/drills/update")
      .addSuccess(DrillContract.update.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(DrillContract.update.payload),
  )
  .add(
    HttpApiEndpoint.post("deleteDrill", "/api/drills/delete")
      .addSuccess(DrillContract.delete.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(DrillContract.delete.payload),
  );
