import { Effect, Schema } from "effect";

import { NotFoundError } from "../error";
import { parsePostgresError } from "../util";

import { PracticeRepo } from "./practice.repo";
import {
  AddItemInput,
  CreatePracticeInput,
  CreateReviewInput,
  DeletePracticeInput,
  GetPracticeInput,
  GetReviewInput,
  ListItemsInput,
  RemoveItemInput,
  ReorderItemsInput,
  UpdateItemInput,
  UpdatePracticeInput,
  UpdateReviewInput,
} from "./practice.schema";

export class PracticeService extends Effect.Service<PracticeService>()(
  "PracticeService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* PracticeRepo;

      return {
        // -----------------------------------------------------------------
        // Practice CRUD
        // -----------------------------------------------------------------

        list: () =>
          repo.list().pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((practices) =>
              Effect.log(`Listed ${practices.length} practices`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to list practices", e),
            ),
          ),

        get: (input: GetPracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetPracticeInput)(input);
            return yield* repo.get(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to get practice", e),
            ),
          ),

        create: (input: CreatePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(CreatePracticeInput)(input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((p) => Effect.log(`Created practice: ${p.publicId}`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to create practice", e),
            ),
          ),

        update: (input: UpdatePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(UpdatePracticeInput)(input);
            return yield* repo.update(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((p) => Effect.log(`Updated practice: ${p.publicId}`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to update practice", e),
            ),
          ),

        delete: (input: DeletePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(DeletePracticeInput)(input);
            return yield* repo.delete(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((p) => Effect.log(`Deleted practice: ${p.publicId}`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to delete practice", e),
            ),
          ),

        // -----------------------------------------------------------------
        // Practice items
        // -----------------------------------------------------------------

        listItems: (input: ListItemsInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(ListItemsInput)(input);
            return yield* repo.listItems(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) => Effect.logError("Failed to list items", e)),
          ),

        addItem: (input: AddItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(AddItemInput)(input);
            return yield* repo.addItem(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((item) => Effect.log(`Added item: ${item.publicId}`)),
            Effect.tapError((e) => Effect.logError("Failed to add item", e)),
          ),

        updateItem: (input: UpdateItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(UpdateItemInput)(input);
            return yield* repo.updateItem(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeItem",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((item) => Effect.log(`Updated item: ${item.publicId}`)),
            Effect.tapError((e) => Effect.logError("Failed to update item", e)),
          ),

        removeItem: (input: RemoveItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(RemoveItemInput)(input);
            return yield* repo.removeItem(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeItem",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((item) => Effect.log(`Removed item: ${item.publicId}`)),
            Effect.tapError((e) => Effect.logError("Failed to remove item", e)),
          ),

        reorderItems: (input: ReorderItemsInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(ReorderItemsInput)(input);
            return yield* repo.reorderItems(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((items) =>
              Effect.log(`Reordered ${items.length} items`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to reorder items", e),
            ),
          ),

        // -----------------------------------------------------------------
        // Practice review
        // -----------------------------------------------------------------

        getReview: (input: GetReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetReviewInput)(input);
            return yield* repo.getReview(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeReview",
                  id: input.practicePublicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) => Effect.logError("Failed to get review", e)),
          ),

        createReview: (input: CreateReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(CreateReviewInput)(input);
            return yield* repo.createReview(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((r) =>
              Effect.log(`Created review for practice: ${r.practicePublicId}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to create review", e),
            ),
          ),

        updateReview: (input: UpdateReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(UpdateReviewInput)(input);
            return yield* repo.updateReview(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeReview",
                  id: input.practicePublicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((r) =>
              Effect.log(`Updated review for practice: ${r.practicePublicId}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to update review", e),
            ),
          ),
      } as const;
    }),
    dependencies: [PracticeRepo.Default],
  },
) {}
