import { DrillService } from "@laxdb/core-v2/drill/drill.service";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "../definition";
import { asDrill } from "../lib/mappers";

export const DrillsHandlersLive = HttpApiBuilder.group(
  LaxdbApiV2,
  "Drills",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* DrillService;

      return handlers
        .handle("listDrills", () =>
          service.list().pipe(Effect.map((rows) => rows.map(asDrill))),
        )
        .handle("getDrill", ({ payload }) =>
          service.get(payload).pipe(Effect.map(asDrill)),
        )
        .handle("createDrill", ({ payload }) =>
          service.create(payload).pipe(Effect.map(asDrill)),
        )
        .handle("updateDrill", ({ payload }) =>
          service.update(payload).pipe(Effect.map(asDrill)),
        )
        .handle("deleteDrill", ({ payload }) =>
          service.delete(payload).pipe(Effect.map(asDrill)),
        );
    }),
).pipe(Layer.provide(DrillService.layer));
