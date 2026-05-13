import { Rpc, RpcGroup } from "effect/unstable/rpc";

import { PracticeOperations } from "./practice.operations";

export class PracticeRpcs extends RpcGroup.make(
  Rpc.make(PracticeOperations.list.rpcName, PracticeOperations.list.contract),
  Rpc.make(PracticeOperations.get.rpcName, PracticeOperations.get.contract),
  Rpc.make(
    PracticeOperations.loadAggregate.rpcName,
    PracticeOperations.loadAggregate.contract,
  ),
  Rpc.make(
    PracticeOperations.saveAggregate.rpcName,
    PracticeOperations.saveAggregate.contract,
  ),
  Rpc.make(
    PracticeOperations.create.rpcName,
    PracticeOperations.create.contract,
  ),
  Rpc.make(
    PracticeOperations.update.rpcName,
    PracticeOperations.update.contract,
  ),
  Rpc.make(
    PracticeOperations.delete.rpcName,
    PracticeOperations.delete.contract,
  ),
  Rpc.make(
    PracticeOperations.listItems.rpcName,
    PracticeOperations.listItems.contract,
  ),
  Rpc.make(
    PracticeOperations.addItem.rpcName,
    PracticeOperations.addItem.contract,
  ),
  Rpc.make(
    PracticeOperations.updateItem.rpcName,
    PracticeOperations.updateItem.contract,
  ),
  Rpc.make(
    PracticeOperations.removeItem.rpcName,
    PracticeOperations.removeItem.contract,
  ),
  Rpc.make(
    PracticeOperations.reorderItems.rpcName,
    PracticeOperations.reorderItems.contract,
  ),
  Rpc.make(
    PracticeOperations.listEdges.rpcName,
    PracticeOperations.listEdges.contract,
  ),
  Rpc.make(
    PracticeOperations.replaceEdges.rpcName,
    PracticeOperations.replaceEdges.contract,
  ),
  Rpc.make(
    PracticeOperations.getReview.rpcName,
    PracticeOperations.getReview.contract,
  ),
  Rpc.make(
    PracticeOperations.createReview.rpcName,
    PracticeOperations.createReview.contract,
  ),
  Rpc.make(
    PracticeOperations.updateReview.rpcName,
    PracticeOperations.updateReview.contract,
  ),
) {}
