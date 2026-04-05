import type {
  CreateDrillInput,
  DeleteDrillInput,
  GetDrillInput,
  UpdateDrillInput,
} from "@laxdb/core/drill/drill.schema";
import { DrillService } from "@laxdb/core/drill/drill.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DrillRpcs } from "./drill.rpc";

export const DrillRpcHandlers = DrillRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DrillService;

    return withRpcLogging({
      DrillList: () => service.list(),
      DrillGet: (payload: GetDrillInput) => service.get(payload),
      DrillCreate: (payload: CreateDrillInput) => service.create(payload),
      DrillUpdate: (payload: UpdateDrillInput) => service.update(payload),
      DrillDelete: (payload: DeleteDrillInput) => service.delete(payload),
    });
  }),
).pipe(Layer.provide(DrillService.layer));
