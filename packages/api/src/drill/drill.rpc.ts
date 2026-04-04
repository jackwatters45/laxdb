import { DrillContract } from "@laxdb/core/drill/drill.contract";
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
