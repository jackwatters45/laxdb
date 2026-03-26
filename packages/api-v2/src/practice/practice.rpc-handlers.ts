import {
  Practice,
  PracticeItem,
  PracticeReview,
} from "@laxdb/core-v2/practice/practice.schema";
import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
import { Effect, Layer } from "effect";

import { PracticeRpcs } from "./practice.rpc";

const asPractice = (row: typeof Practice.Type) => new Practice(row);
const asItem = (row: typeof PracticeItem.Type) => new PracticeItem(row);
const asReview = (row: typeof PracticeReview.Type) => new PracticeReview(row);

export const PracticeRpcHandlers = PracticeRpcs.toLayer(
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
