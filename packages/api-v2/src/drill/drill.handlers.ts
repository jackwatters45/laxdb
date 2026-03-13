import { DrillService } from "@laxdb/core-v2/drill/drill.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";

export const DrillsHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Drills",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* DrillService;

      return handlers
        .handle("listDrills", () => service.list())
        .handle("getDrill", ({ payload }) => service.get(payload))
        .handle("createDrill", ({ payload }) => service.create(payload))
        .handle("updateDrill", ({ payload }) => service.update(payload))
        .handle("deleteDrill", ({ payload }) => service.delete(payload));
    }),
).pipe(Layer.provide(DrillService.layer));
