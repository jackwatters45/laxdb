import { DrillService } from "@laxdb/core/drill/drill.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DrillOperations } from "./drill.operations";
import { DrillRpcs } from "./drill.rpc";

export const DrillRpcHandlers = DrillRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DrillService;

    return withRpcLogging({
      [DrillOperations.list.rpcName]: service.list,
      [DrillOperations.get.rpcName]: service.get,
      [DrillOperations.create.rpcName]: service.create,
      [DrillOperations.update.rpcName]: service.update,
      [DrillOperations.delete.rpcName]: service.delete,
    });
  }),
).pipe(Layer.provide(DrillService.layer));
