import { DrillService } from "@laxdb/core/drill/drill.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApi } from "../definition";

export const DrillsHandlers = HttpApiBuilder.group(
  LaxdbApi,
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
);
