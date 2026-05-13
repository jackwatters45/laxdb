import { PracticeService } from "@laxdb/core/practice/practice.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

import { PracticeOperations } from "./practice.operations";

export const PracticesHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Practices",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PracticeService;

      return handlers
        .handle(PracticeOperations.list.httpName, () => service.list())
        .handle(PracticeOperations.get.httpName, ({ payload }) =>
          service.get(payload),
        )
        .handle(PracticeOperations.loadAggregate.httpName, ({ payload }) =>
          service.loadAggregate(payload),
        )
        .handle(PracticeOperations.saveAggregate.httpName, ({ payload }) =>
          service.saveAggregate(payload),
        )
        .handle(PracticeOperations.create.httpName, ({ payload }) =>
          service.create(payload),
        )
        .handle(PracticeOperations.update.httpName, ({ payload }) =>
          service.update(payload),
        )
        .handle(PracticeOperations.delete.httpName, ({ payload }) =>
          service.delete(payload),
        )
        .handle(PracticeOperations.listItems.httpName, ({ payload }) =>
          service.listItems(payload),
        )
        .handle(PracticeOperations.addItem.httpName, ({ payload }) =>
          service.addItem(payload),
        )
        .handle(PracticeOperations.updateItem.httpName, ({ payload }) =>
          service.updateItem(payload),
        )
        .handle(PracticeOperations.removeItem.httpName, ({ payload }) =>
          service.removeItem(payload),
        )
        .handle(PracticeOperations.reorderItems.httpName, ({ payload }) =>
          service.reorderItems(payload),
        )
        .handle(PracticeOperations.listEdges.httpName, ({ payload }) =>
          service.listEdges(payload),
        )
        .handle(PracticeOperations.replaceEdges.httpName, ({ payload }) =>
          service.replaceEdges(payload),
        )
        .handle(PracticeOperations.getReview.httpName, ({ payload }) =>
          service.getReview(payload),
        )
        .handle(PracticeOperations.createReview.httpName, ({ payload }) =>
          service.createReview(payload),
        )
        .handle(PracticeOperations.updateReview.httpName, ({ payload }) =>
          service.updateReview(payload),
        );
    }),
).pipe(Layer.provide(PracticeService.layer));
