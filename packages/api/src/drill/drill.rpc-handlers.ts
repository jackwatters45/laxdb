import { DrillService } from "@laxdb/core/drill/drill.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DrillRpcs } from "./drill.rpc";

export const DrillRpcHandlers = DrillRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DrillService;

    return withRpcLogging({
      DrillList: () => service.list(),
      DrillGet: (payload) => service.get(payload),
      DrillCreate: (payload) => service.create(payload),
      DrillUpdate: (payload) => service.update(payload),
      DrillDelete: (payload) => service.delete(payload),
    });
  }),
).pipe(Layer.provide(DrillService.layer));
