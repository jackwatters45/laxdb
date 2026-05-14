import { PracticeContract } from "@laxdb/core/practice/practice.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DomainErrors } from "../errors";

export const PracticesGroup = HttpApiGroup.make("Practices")
  // Practice CRUD
  .add(
    HttpApiEndpoint.post("listPractices", "/api/practices", {
      success: PracticeContract.list.success,
      error: DomainErrors,
    }),
  )
  .add(
    HttpApiEndpoint.post("getPractice", "/api/practices/get", {
      success: PracticeContract.get.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.get.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("createPractice", "/api/practices/create", {
      success: PracticeContract.create.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.create.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("updatePractice", "/api/practices/update", {
      success: PracticeContract.update.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.update.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("deletePractice", "/api/practices/delete", {
      success: PracticeContract.delete.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.delete.payload),
    }),
  )

  // Practice items
  .add(
    HttpApiEndpoint.post("listPracticeItems", "/api/practices/items", {
      success: PracticeContract.listItems.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.listItems.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("addPracticeItem", "/api/practices/items/add", {
      success: PracticeContract.addItem.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.addItem.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("updatePracticeItem", "/api/practices/items/update", {
      success: PracticeContract.updateItem.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.updateItem.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("removePracticeItem", "/api/practices/items/remove", {
      success: PracticeContract.removeItem.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.removeItem.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post(
      "reorderPracticeItems",
      "/api/practices/items/reorder",
      {
        success: PracticeContract.reorderItems.success,
        error: DomainErrors,
        payload: Schema.toEncoded(PracticeContract.reorderItems.payload),
      },
    ),
  )
  .add(
    HttpApiEndpoint.post("listPracticeEdges", "/api/practices/edges", {
      success: PracticeContract.listEdges.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.listEdges.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post(
      "replacePracticeEdges",
      "/api/practices/edges/replace",
      {
        success: PracticeContract.replaceEdges.success,
        error: DomainErrors,
        payload: Schema.toEncoded(PracticeContract.replaceEdges.payload),
      },
    ),
  )

  // Practice review
  .add(
    HttpApiEndpoint.post("getPracticeReview", "/api/practices/review/get", {
      success: PracticeContract.getReview.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PracticeContract.getReview.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post(
      "createPracticeReview",
      "/api/practices/review/create",
      {
        success: PracticeContract.createReview.success,
        error: DomainErrors,
        payload: Schema.toEncoded(PracticeContract.createReview.payload),
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      "updatePracticeReview",
      "/api/practices/review/update",
      {
        success: PracticeContract.updateReview.success,
        error: DomainErrors,
        payload: Schema.toEncoded(PracticeContract.updateReview.payload),
      },
    ),
  );
