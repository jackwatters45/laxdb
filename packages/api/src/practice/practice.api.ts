import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PracticeContract } from "@laxdb/core/practice/practice.contract";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

const errors = [
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
] as const;

export const PracticesGroup = HttpApiGroup.make("Practices")
  // Practice CRUD
  .add(
    HttpApiEndpoint.post("listPractices", "/api/practices", {
      success: PracticeContract.list.success,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.post("getPractice", "/api/practices/get", {
      success: PracticeContract.get.success,
      error: errors,
      payload: PracticeContract.get.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("createPractice", "/api/practices/create", {
      success: PracticeContract.create.success,
      error: errors,
      payload: PracticeContract.create.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("updatePractice", "/api/practices/update", {
      success: PracticeContract.update.success,
      error: errors,
      payload: PracticeContract.update.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("deletePractice", "/api/practices/delete", {
      success: PracticeContract.delete.success,
      error: errors,
      payload: PracticeContract.delete.payload,
    }),
  )

  // Practice items
  .add(
    HttpApiEndpoint.post("listPracticeItems", "/api/practices/items", {
      success: PracticeContract.listItems.success,
      error: errors,
      payload: PracticeContract.listItems.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("addPracticeItem", "/api/practices/items/add", {
      success: PracticeContract.addItem.success,
      error: errors,
      payload: PracticeContract.addItem.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("updatePracticeItem", "/api/practices/items/update", {
      success: PracticeContract.updateItem.success,
      error: errors,
      payload: PracticeContract.updateItem.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post("removePracticeItem", "/api/practices/items/remove", {
      success: PracticeContract.removeItem.success,
      error: errors,
      payload: PracticeContract.removeItem.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post(
      "reorderPracticeItems",
      "/api/practices/items/reorder",
      {
        success: PracticeContract.reorderItems.success,
        error: errors,
        payload: PracticeContract.reorderItems.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post("listPracticeEdges", "/api/practices/edges", {
      success: PracticeContract.listEdges.success,
      error: errors,
      payload: PracticeContract.listEdges.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post(
      "replacePracticeEdges",
      "/api/practices/edges/replace",
      {
        success: PracticeContract.replaceEdges.success,
        error: errors,
        payload: PracticeContract.replaceEdges.payload,
      },
    ),
  )

  // Practice review
  .add(
    HttpApiEndpoint.post("getPracticeReview", "/api/practices/review/get", {
      success: PracticeContract.getReview.success,
      error: errors,
      payload: PracticeContract.getReview.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post(
      "createPracticeReview",
      "/api/practices/review/create",
      {
        success: PracticeContract.createReview.success,
        error: errors,
        payload: PracticeContract.createReview.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      "updatePracticeReview",
      "/api/practices/review/update",
      {
        success: PracticeContract.updateReview.success,
        error: errors,
        payload: PracticeContract.updateReview.payload,
      },
    ),
  );
