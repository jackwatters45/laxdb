import type {
  AddItemInput,
  CreatePracticeInput,
  CreateReviewInput,
  DeletePracticeInput,
  GetPracticeInput,
  GetReviewInput,
  ListEdgesInput,
  ListItemsInput,
  RemoveItemInput,
  ReorderItemsInput,
  ReplaceEdgesInput,
  UpdateItemInput,
  UpdatePracticeInput,
  UpdateReviewInput,
} from "@laxdb/core/practice/practice.schema";
import { PracticeService } from "@laxdb/core/practice/practice.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PracticeRpcs } from "./practice.rpc";

export const PracticeRpcHandlers = PracticeRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PracticeService;

    return withRpcLogging({
      PracticeList: () => service.list(),
      PracticeGet: (payload: GetPracticeInput) => service.get(payload),
      PracticeCreate: (payload: CreatePracticeInput) => service.create(payload),
      PracticeUpdate: (payload: UpdatePracticeInput) => service.update(payload),
      PracticeDelete: (payload: DeletePracticeInput) => service.delete(payload),
      PracticeListItems: (payload: ListItemsInput) =>
        service.listItems(payload),
      PracticeAddItem: (payload: AddItemInput) => service.addItem(payload),
      PracticeUpdateItem: (payload: UpdateItemInput) =>
        service.updateItem(payload),
      PracticeRemoveItem: (payload: RemoveItemInput) =>
        service.removeItem(payload),
      PracticeReorderItems: (payload: ReorderItemsInput) =>
        service.reorderItems(payload),
      PracticeListEdges: (payload: ListEdgesInput) =>
        service.listEdges(payload),
      PracticeReplaceEdges: (payload: ReplaceEdgesInput) =>
        service.replaceEdges(payload),
      PracticeGetReview: (payload: GetReviewInput) =>
        service.getReview(payload),
      PracticeCreateReview: (payload: CreateReviewInput) =>
        service.createReview(payload),
      PracticeUpdateReview: (payload: UpdateReviewInput) =>
        service.updateReview(payload),
    });
  }),
).pipe(Layer.provide(PracticeService.layer));
