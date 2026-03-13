import { DrillContract } from "@laxdb/core-v2/drill/drill.contract";
import { DrillService } from "@laxdb/core-v2/drill/drill.service";
import { Effect, Layer } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class DrillRpcs extends RpcGroup.make(
  Rpc.make("DrillList", {
    success: DrillContract.list.success,
    error: DrillContract.list.error,
    payload: DrillContract.list.payload,
  }),
  Rpc.make("DrillGet", {
    success: DrillContract.get.success,
    error: DrillContract.get.error,
    payload: DrillContract.get.payload,
  }),
  Rpc.make("DrillCreate", {
    success: DrillContract.create.success,
    error: DrillContract.create.error,
    payload: DrillContract.create.payload,
  }),
  Rpc.make("DrillUpdate", {
    success: DrillContract.update.success,
    error: DrillContract.update.error,
    payload: DrillContract.update.payload,
  }),
  Rpc.make("DrillDelete", {
    success: DrillContract.delete.success,
    error: DrillContract.delete.error,
    payload: DrillContract.delete.payload,
  }),
) {}

export const DrillHandlers = DrillRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DrillService;

    return {
      DrillList: () => service.list(),
      DrillGet: (payload) => service.get(payload),
      DrillCreate: (payload) => service.create(payload),
      DrillUpdate: (payload) => service.update(payload),
      DrillDelete: (payload) => service.delete(payload),
    };
  }),
).pipe(Layer.provide(DrillService.layer));
