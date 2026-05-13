import { Rpc, RpcGroup } from "effect/unstable/rpc";

import { DefaultsOperations } from "./defaults.operations";

export class DefaultsRpcs extends RpcGroup.make(
  Rpc.make(
    DefaultsOperations.getNamespace.rpcName,
    DefaultsOperations.getNamespace.contract,
  ),
  Rpc.make(
    DefaultsOperations.patchNamespace.rpcName,
    DefaultsOperations.patchNamespace.contract,
  ),
) {}
