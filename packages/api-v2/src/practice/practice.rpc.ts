import { PracticeContract } from "@laxdb/core-v2/practice/practice.contract";
import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
import { Effect, Layer } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class PracticeRpcs extends RpcGroup.make(
  // Practice CRUD
  Rpc.make("PracticeList", {
    success: PracticeContract.list.success,
    error: PracticeContract.list.error,
    payload: PracticeContract.list.payload,
  }),
  Rpc.make("PracticeGet", {
    success: PracticeContract.get.success,
    error: PracticeContract.get.error,
    payload: PracticeContract.get.payload,
  }),
  Rpc.make("PracticeCreate", {
    success: PracticeContract.create.success,
    error: PracticeContract.create.error,
    payload: PracticeContract.create.payload,
  }),
  Rpc.make("PracticeUpdate", {
    success: PracticeContract.update.success,
    error: PracticeContract.update.error,
    payload: PracticeContract.update.payload,
  }),
  Rpc.make("PracticeDelete", {
    success: PracticeContract.delete.success,
    error: PracticeContract.delete.error,
    payload: PracticeContract.delete.payload,
  }),

  // Practice items
  Rpc.make("PracticeListItems", {
    success: PracticeContract.listItems.success,
    error: PracticeContract.listItems.error,
    payload: PracticeContract.listItems.payload,
  }),
  Rpc.make("PracticeAddItem", {
    success: PracticeContract.addItem.success,
    error: PracticeContract.addItem.error,
    payload: PracticeContract.addItem.payload,
  }),
  Rpc.make("PracticeUpdateItem", {
    success: PracticeContract.updateItem.success,
    error: PracticeContract.updateItem.error,
    payload: PracticeContract.updateItem.payload,
  }),
  Rpc.make("PracticeRemoveItem", {
    success: PracticeContract.removeItem.success,
    error: PracticeContract.removeItem.error,
    payload: PracticeContract.removeItem.payload,
  }),
  Rpc.make("PracticeReorderItems", {
    success: PracticeContract.reorderItems.success,
    error: PracticeContract.reorderItems.error,
    payload: PracticeContract.reorderItems.payload,
  }),

  // Practice review
  Rpc.make("PracticeGetReview", {
    success: PracticeContract.getReview.success,
    error: PracticeContract.getReview.error,
    payload: PracticeContract.getReview.payload,
  }),
  Rpc.make("PracticeCreateReview", {
    success: PracticeContract.createReview.success,
    error: PracticeContract.createReview.error,
    payload: PracticeContract.createReview.payload,
  }),
  Rpc.make("PracticeUpdateReview", {
    success: PracticeContract.updateReview.success,
    error: PracticeContract.updateReview.error,
    payload: PracticeContract.updateReview.payload,
  }),
) {}

export const PracticeHandlers = PracticeRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PracticeService;

    return {
      // Practice CRUD
      PracticeList: () => service.list(),
      PracticeGet: (payload) => service.get(payload),
      PracticeCreate: (payload) => service.create(payload),
      PracticeUpdate: (payload) => service.update(payload),
      PracticeDelete: (payload) => service.delete(payload),

      // Practice items
      PracticeListItems: (payload) => service.listItems(payload),
      PracticeAddItem: (payload) => service.addItem(payload),
      PracticeUpdateItem: (payload) => service.updateItem(payload),
      PracticeRemoveItem: (payload) => service.removeItem(payload),
      PracticeReorderItems: (payload) => service.reorderItems(payload),

      // Practice review
      PracticeGetReview: (payload) => service.getReview(payload),
      PracticeCreateReview: (payload) => service.createReview(payload),
      PracticeUpdateReview: (payload) => service.updateReview(payload),
    };
  }),
).pipe(Layer.provide(PracticeService.layer));
