import { DrillService } from "@laxdb/core/drill/drill.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DrillRpcs } from "./drill.rpc";

export const DrillRpcHandlers = DrillRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DrillService;

    return withRpcLogging({
      DrillList: service.list,
      DrillGet: service.get,
      DrillCreate: service.create,
      DrillUpdate: service.update,
      DrillDelete: service.delete,
    });
  }),
).pipe(Layer.provide(DrillService.layer));
