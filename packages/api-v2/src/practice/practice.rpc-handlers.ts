import { PracticeDefaultsService } from "@laxdb/core-v2/practice/practice-defaults.service";
import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PracticeRpcs } from "./practice.rpc";

export const PracticeRpcHandlers = PracticeRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PracticeService;
    const defaultsService = yield* PracticeDefaultsService;

    return withRpcLogging({
      PracticeList: () => service.list(),
      PracticeGet: (payload) => service.get(payload),
      PracticeCreate: (payload) => service.create(payload),
      PracticeUpdate: (payload) => service.update(payload),
      PracticeDelete: (payload) => service.delete(payload),
      PracticeListItems: (payload) => service.listItems(payload),
      PracticeAddItem: (payload) => service.addItem(payload),
      PracticeUpdateItem: (payload) => service.updateItem(payload),
      PracticeRemoveItem: (payload) => service.removeItem(payload),
      PracticeReorderItems: (payload) => service.reorderItems(payload),
      PracticeListEdges: (payload) => service.listEdges(payload),
      PracticeReplaceEdges: (payload) => service.replaceEdges(payload),
      PracticeGetReview: (payload) => service.getReview(payload),
      PracticeCreateReview: (payload) => service.createReview(payload),
      PracticeUpdateReview: (payload) => service.updateReview(payload),
      PracticeGetDefaults: () => defaultsService.get(),
      PracticeUpsertDefaults: (payload) => defaultsService.upsert(payload),
    });
  }),
).pipe(
  Layer.provide(PracticeService.layer),
  Layer.provide(PracticeDefaultsService.layer),
);
