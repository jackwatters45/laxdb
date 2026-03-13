import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

export const PracticesHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Practices",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PracticeService;

      return (
        handlers
          // Practice CRUD
          .handle("listPractices", () => service.list())
          .handle("getPractice", ({ payload }) => service.get(payload))
          .handle("createPractice", ({ payload }) => service.create(payload))
          .handle("updatePractice", ({ payload }) => service.update(payload))
          .handle("deletePractice", ({ payload }) => service.delete(payload))
          // Practice items
          .handle("listPracticeItems", ({ payload }) =>
            service.listItems(payload),
          )
          .handle("addPracticeItem", ({ payload }) => service.addItem(payload))
          .handle("updatePracticeItem", ({ payload }) =>
            service.updateItem(payload),
          )
          .handle("removePracticeItem", ({ payload }) =>
            service.removeItem(payload),
          )
          .handle("reorderPracticeItems", ({ payload }) =>
            service.reorderItems(payload),
          )
          // Practice review
          .handle("getPracticeReview", ({ payload }) =>
            service.getReview(payload),
          )
          .handle("createPracticeReview", ({ payload }) =>
            service.createReview(payload),
          )
          .handle("updatePracticeReview", ({ payload }) =>
            service.updateReview(payload),
          )
      );
    }),
).pipe(Layer.provide(PracticeService.layer));
