import {
  Practice,
  PracticeItem,
  PracticeReview,
} from "@laxdb/core-v2/practice/practice.schema";
import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

const asPractice = (row: typeof Practice.Type) => new Practice(row);
const asItem = (row: typeof PracticeItem.Type) => new PracticeItem(row);
const asReview = (row: typeof PracticeReview.Type) => new PracticeReview(row);

export const PracticesHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Practices",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PracticeService;

      return (
        handlers
          // Practice CRUD
          .handle("listPractices", () =>
            service.list().pipe(Effect.map((rows) => rows.map(asPractice))),
          )
          .handle("getPractice", ({ payload }) =>
            service.get(payload).pipe(Effect.map(asPractice)),
          )
          .handle("createPractice", ({ payload }) =>
            service.create(payload).pipe(Effect.map(asPractice)),
          )
          .handle("updatePractice", ({ payload }) =>
            service.update(payload).pipe(Effect.map(asPractice)),
          )
          .handle("deletePractice", ({ payload }) =>
            service.delete(payload).pipe(Effect.map(asPractice)),
          )
          // Practice items
          .handle("listPracticeItems", ({ payload }) =>
            service
              .listItems(payload)
              .pipe(Effect.map((rows) => rows.map(asItem))),
          )
          .handle("addPracticeItem", ({ payload }) =>
            service.addItem(payload).pipe(Effect.map(asItem)),
          )
          .handle("updatePracticeItem", ({ payload }) =>
            service.updateItem(payload).pipe(Effect.map(asItem)),
          )
          .handle("removePracticeItem", ({ payload }) =>
            service.removeItem(payload).pipe(Effect.map(asItem)),
          )
          .handle("reorderPracticeItems", ({ payload }) =>
            service
              .reorderItems(payload)
              .pipe(Effect.map((rows) => rows.map(asItem))),
          )
          // Practice review
          .handle("getPracticeReview", ({ payload }) =>
            service.getReview(payload).pipe(Effect.map(asReview)),
          )
          .handle("createPracticeReview", ({ payload }) =>
            service.createReview(payload).pipe(Effect.map(asReview)),
          )
          .handle("updatePracticeReview", ({ payload }) =>
            service.updateReview(payload).pipe(Effect.map(asReview)),
          )
      );
    }),
).pipe(Layer.provide(PracticeService.layer));
