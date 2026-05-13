import { PracticeService } from "@laxdb/core/practice/practice.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PracticeOperations } from "./practice.operations";
import { PracticeRpcs } from "./practice.rpc";

export const PracticeRpcHandlers = PracticeRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PracticeService;

    return withRpcLogging({
      [PracticeOperations.list.rpcName]: service.list,
      [PracticeOperations.get.rpcName]: service.get,
      [PracticeOperations.loadAggregate.rpcName]: service.loadAggregate,
      [PracticeOperations.saveAggregate.rpcName]: service.saveAggregate,
      [PracticeOperations.create.rpcName]: service.create,
      [PracticeOperations.update.rpcName]: service.update,
      [PracticeOperations.delete.rpcName]: service.delete,
      [PracticeOperations.listItems.rpcName]: service.listItems,
      [PracticeOperations.addItem.rpcName]: service.addItem,
      [PracticeOperations.updateItem.rpcName]: service.updateItem,
      [PracticeOperations.removeItem.rpcName]: service.removeItem,
      [PracticeOperations.reorderItems.rpcName]: service.reorderItems,
      [PracticeOperations.listEdges.rpcName]: service.listEdges,
      [PracticeOperations.replaceEdges.rpcName]: service.replaceEdges,
      [PracticeOperations.getReview.rpcName]: service.getReview,
      [PracticeOperations.createReview.rpcName]: service.createReview,
      [PracticeOperations.updateReview.rpcName]: service.updateReview,
    });
  }),
).pipe(Layer.provide(PracticeService.layer));
