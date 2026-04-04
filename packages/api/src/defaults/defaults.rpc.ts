import { DefaultsContract } from "@laxdb/core/defaults/defaults.contract";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class DefaultsRpcs extends RpcGroup.make(
  Rpc.make("DefaultsGetNamespace", {
    success: DefaultsContract.getNamespace.success,
    error: DefaultsContract.getNamespace.error,
    payload: DefaultsContract.getNamespace.payload,
  }),
  Rpc.make("DefaultsPatchNamespace", {
    success: DefaultsContract.patchNamespace.success,
    error: DefaultsContract.patchNamespace.error,
    payload: DefaultsContract.patchNamespace.payload,
  }),
) {}
