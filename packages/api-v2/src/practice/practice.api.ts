import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core-v2/error";
import { PracticeContract } from "@laxdb/core-v2/practice/practice.contract";

export const PracticesGroup = HttpApiGroup.make("Practices")
  // Practice CRUD
  .add(
    HttpApiEndpoint.post("listPractices", "/api/practices")
      .addSuccess(PracticeContract.list.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError),
  )
  .add(
    HttpApiEndpoint.post("getPractice", "/api/practices/get")
      .addSuccess(PracticeContract.get.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.get.payload),
  )
  .add(
    HttpApiEndpoint.post("createPractice", "/api/practices/create")
      .addSuccess(PracticeContract.create.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.create.payload),
  )
  .add(
    HttpApiEndpoint.post("updatePractice", "/api/practices/update")
      .addSuccess(PracticeContract.update.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.update.payload),
  )
  .add(
    HttpApiEndpoint.post("deletePractice", "/api/practices/delete")
      .addSuccess(PracticeContract.delete.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.delete.payload),
  )

  // Practice items
  .add(
    HttpApiEndpoint.post("listPracticeItems", "/api/practices/items")
      .addSuccess(PracticeContract.listItems.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.listItems.payload),
  )
  .add(
    HttpApiEndpoint.post("addPracticeItem", "/api/practices/items/add")
      .addSuccess(PracticeContract.addItem.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.addItem.payload),
  )
  .add(
    HttpApiEndpoint.post("updatePracticeItem", "/api/practices/items/update")
      .addSuccess(PracticeContract.updateItem.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.updateItem.payload),
  )
  .add(
    HttpApiEndpoint.post("removePracticeItem", "/api/practices/items/remove")
      .addSuccess(PracticeContract.removeItem.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.removeItem.payload),
  )
  .add(
    HttpApiEndpoint.post("reorderPracticeItems", "/api/practices/items/reorder")
      .addSuccess(PracticeContract.reorderItems.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.reorderItems.payload),
  )

  // Practice review
  .add(
    HttpApiEndpoint.post("getPracticeReview", "/api/practices/review/get")
      .addSuccess(PracticeContract.getReview.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.getReview.payload),
  )
  .add(
    HttpApiEndpoint.post("createPracticeReview", "/api/practices/review/create")
      .addSuccess(PracticeContract.createReview.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.createReview.payload),
  )
  .add(
    HttpApiEndpoint.post("updatePracticeReview", "/api/practices/review/update")
      .addSuccess(PracticeContract.updateReview.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(PracticeContract.updateReview.payload),
  );
