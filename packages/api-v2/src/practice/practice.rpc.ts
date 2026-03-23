import { PracticeContract } from "@laxdb/core-v2/practice/practice.contract";
import {
  Practice,
  PracticeItem,
  PracticeReview,
} from "@laxdb/core-v2/practice/practice.schema";
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

const asPractice = (row: typeof Practice.Type) => new Practice(row);
const asItem = (row: typeof PracticeItem.Type) => new PracticeItem(row);
const asReview = (row: typeof PracticeReview.Type) => new PracticeReview(row);

export const PracticeHandlers = PracticeRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PracticeService;

    return {
      // Practice CRUD
      PracticeList: () =>
        service.list().pipe(Effect.map((rows) => rows.map(asPractice))),
      PracticeGet: (payload) =>
        service.get(payload).pipe(Effect.map(asPractice)),
      PracticeCreate: (payload) =>
        service.create(payload).pipe(Effect.map(asPractice)),
      PracticeUpdate: (payload) =>
        service.update(payload).pipe(Effect.map(asPractice)),
      PracticeDelete: (payload) =>
        service.delete(payload).pipe(Effect.map(asPractice)),

      // Practice items
      PracticeListItems: (payload) =>
        service.listItems(payload).pipe(Effect.map((rows) => rows.map(asItem))),
      PracticeAddItem: (payload) =>
        service.addItem(payload).pipe(Effect.map(asItem)),
      PracticeUpdateItem: (payload) =>
        service.updateItem(payload).pipe(Effect.map(asItem)),
      PracticeRemoveItem: (payload) =>
        service.removeItem(payload).pipe(Effect.map(asItem)),
      PracticeReorderItems: (payload) =>
        service
          .reorderItems(payload)
          .pipe(Effect.map((rows) => rows.map(asItem))),

      // Practice review
      PracticeGetReview: (payload) =>
        service.getReview(payload).pipe(Effect.map(asReview)),
      PracticeCreateReview: (payload) =>
        service.createReview(payload).pipe(Effect.map(asReview)),
      PracticeUpdateReview: (payload) =>
        service.updateReview(payload).pipe(Effect.map(asReview)),
    };
  }),
).pipe(Layer.provide(PracticeService.layer));
