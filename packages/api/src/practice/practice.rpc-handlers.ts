import { PracticeService } from "@laxdb/core/practice/practice.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PracticeRpcs } from "./practice.rpc";

export const PracticeRpcHandlers = PracticeRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PracticeService;

    return withRpcLogging({
      PracticeList: service.list,
      PracticeGet: service.get,
      PracticeCreate: service.create,
      PracticeUpdate: service.update,
      PracticeDelete: service.delete,
      PracticeListItems: service.listItems,
      PracticeAddItem: service.addItem,
      PracticeUpdateItem: service.updateItem,
      PracticeRemoveItem: service.removeItem,
      PracticeReorderItems: service.reorderItems,
      PracticeListEdges: service.listEdges,
      PracticeReplaceEdges: service.replaceEdges,
      PracticeGetReview: service.getReview,
      PracticeCreateReview: service.createReview,
      PracticeUpdateReview: service.updateReview,
    });
  }),
).pipe(Layer.provide(PracticeService.layer));
