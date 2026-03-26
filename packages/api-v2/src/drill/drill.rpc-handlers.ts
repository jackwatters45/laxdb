import { asDrill } from "@laxdb/core-v2/drill/drill.schema";
import { DrillService } from "@laxdb/core-v2/drill/drill.service";
import { Effect, Layer } from "effect";

import { DrillRpcs } from "./drill.rpc";

export const DrillRpcHandlers = DrillRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DrillService;

    return {
      DrillList: () =>
        service.list().pipe(Effect.map((rows) => rows.map(asDrill))),
      DrillGet: (payload) => service.get(payload).pipe(Effect.map(asDrill)),
      DrillCreate: (payload) =>
        service.create(payload).pipe(Effect.map(asDrill)),
      DrillUpdate: (payload) =>
        service.update(payload).pipe(Effect.map(asDrill)),
      DrillDelete: (payload) =>
        service.delete(payload).pipe(Effect.map(asDrill)),
    };
  }),
).pipe(Layer.provide(DrillService.layer));
