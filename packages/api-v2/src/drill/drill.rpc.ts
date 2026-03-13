import { DrillContract } from "@laxdb/core-v2/drill/drill.contract";
import { Drill } from "@laxdb/core-v2/drill/drill.schema";
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

const asDrill = (row: typeof Drill.Type) => new Drill(row);

export const DrillHandlers = DrillRpcs.toLayer(
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
