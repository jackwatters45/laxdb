import { Rpc, RpcGroup } from "effect/unstable/rpc";

import { DrillOperations } from "./drill.operations";

export class DrillRpcs extends RpcGroup.make(
  Rpc.make(DrillOperations.list.rpcName, DrillOperations.list.contract),
  Rpc.make(DrillOperations.get.rpcName, DrillOperations.get.contract),
  Rpc.make(DrillOperations.create.rpcName, DrillOperations.create.contract),
  Rpc.make(DrillOperations.update.rpcName, DrillOperations.update.contract),
  Rpc.make(DrillOperations.delete.rpcName, DrillOperations.delete.contract),
) {}
