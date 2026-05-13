import { DrillService } from "@laxdb/core/drill/drill.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

import { DrillOperations } from "./drill.operations";

export const DrillsHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Drills",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* DrillService;

      return handlers
        .handle(DrillOperations.list.httpName, () => service.list())
        .handle(DrillOperations.get.httpName, ({ payload }) =>
          service.get(payload),
        )
        .handle(DrillOperations.create.httpName, ({ payload }) =>
          service.create(payload),
        )
        .handle(DrillOperations.update.httpName, ({ payload }) =>
          service.update(payload),
        )
        .handle(DrillOperations.delete.httpName, ({ payload }) =>
          service.delete(payload),
        );
    }),
).pipe(Layer.provide(DrillService.layer));
