import { PracticeContract } from "@laxdb/core/practice/practice.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DomainErrors } from "../errors";

const listPractices = HttpApiEndpoint.post("listPractices", "/api/practices", {
  success: PracticeContract.list.success,
  error: DomainErrors,
});

const getPractice = HttpApiEndpoint.post("getPractice", "/api/practices/get", {
  success: PracticeContract.get.success,
  error: DomainErrors,
  payload: Schema.toEncoded(PracticeContract.get.payload),
});

const createPractice = HttpApiEndpoint.post(
  "createPractice",
  "/api/practices/create",
  {
    success: PracticeContract.create.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.create.payload),
  },
);

const updatePractice = HttpApiEndpoint.post(
  "updatePractice",
  "/api/practices/update",
  {
    success: PracticeContract.update.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.update.payload),
  },
);

const deletePractice = HttpApiEndpoint.post(
  "deletePractice",
  "/api/practices/delete",
  {
    success: PracticeContract.delete.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.delete.payload),
  },
);

const listPracticeItems = HttpApiEndpoint.post(
  "listPracticeItems",
  "/api/practices/items",
  {
    success: PracticeContract.listItems.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.listItems.payload),
  },
);

const addPracticeItem = HttpApiEndpoint.post(
  "addPracticeItem",
  "/api/practices/items/add",
  {
    success: PracticeContract.addItem.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.addItem.payload),
  },
);

const updatePracticeItem = HttpApiEndpoint.post(
  "updatePracticeItem",
  "/api/practices/items/update",
  {
    success: PracticeContract.updateItem.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.updateItem.payload),
  },
);

const removePracticeItem = HttpApiEndpoint.post(
  "removePracticeItem",
  "/api/practices/items/remove",
  {
    success: PracticeContract.removeItem.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.removeItem.payload),
  },
);

const reorderPracticeItems = HttpApiEndpoint.post(
  "reorderPracticeItems",
  "/api/practices/items/reorder",
  {
    success: PracticeContract.reorderItems.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.reorderItems.payload),
  },
);

const listPracticeEdges = HttpApiEndpoint.post(
  "listPracticeEdges",
  "/api/practices/edges",
  {
    success: PracticeContract.listEdges.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.listEdges.payload),
  },
);

const replacePracticeEdges = HttpApiEndpoint.post(
  "replacePracticeEdges",
  "/api/practices/edges/replace",
  {
    success: PracticeContract.replaceEdges.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.replaceEdges.payload),
  },
);

const getPracticeReview = HttpApiEndpoint.post(
  "getPracticeReview",
  "/api/practices/review/get",
  {
    success: PracticeContract.getReview.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.getReview.payload),
  },
);

const createPracticeReview = HttpApiEndpoint.post(
  "createPracticeReview",
  "/api/practices/review/create",
  {
    success: PracticeContract.createReview.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.createReview.payload),
  },
);

const updatePracticeReview = HttpApiEndpoint.post(
  "updatePracticeReview",
  "/api/practices/review/update",
  {
    success: PracticeContract.updateReview.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PracticeContract.updateReview.payload),
  },
);

export const PracticesGroup = HttpApiGroup.make("Practices")
  .add(listPractices)
  .add(getPractice)
  .add(createPractice)
  .add(updatePractice)
  .add(deletePractice)
  .add(listPracticeItems)
  .add(addPracticeItem)
  .add(updatePracticeItem)
  .add(removePracticeItem)
  .add(reorderPracticeItems)
  .add(listPracticeEdges)
  .add(replacePracticeEdges)
  .add(getPracticeReview)
  .add(createPracticeReview)
  .add(updatePracticeReview);
