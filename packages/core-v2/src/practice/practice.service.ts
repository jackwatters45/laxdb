import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { decodeArguments, parsePostgresError } from "../util";

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

export class PracticeService extends ServiceMap.Service<PracticeService>()(
  "PracticeService",
  {
    make: Effect.gen(function* () {
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

            Effect.tapError(Effect.logError),
          ),

        get: (input: GetPracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetPracticeInput, input);
            return yield* repo.get(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),

        create: (input: CreatePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreatePracticeInput, input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: "new",
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),

            Effect.tapError(Effect.logError),
          ),

        update: (input: UpdatePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdatePracticeInput, input);
            return yield* repo.update(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),

        delete: (input: DeletePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(DeletePracticeInput, input);
            return yield* repo.delete(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),

        // -----------------------------------------------------------------
        // Practice items
        // -----------------------------------------------------------------

        listItems: (input: ListItemsInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ListItemsInput, input);
            return yield* repo.listItems(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),

            Effect.tapError(Effect.logError),
          ),

        addItem: (input: AddItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(AddItemInput, input);
            return yield* repo.addItem(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeItem",
                  id: "new",
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),

            Effect.tapError(Effect.logError),
          ),

        updateItem: (input: UpdateItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateItemInput, input);
            return yield* repo.updateItem(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),

        removeItem: (input: RemoveItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(RemoveItemInput, input);
            return yield* repo.removeItem(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),

        reorderItems: (input: ReorderItemsInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ReorderItemsInput, input);
            return yield* repo.reorderItems(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),

            Effect.tapError(Effect.logError),
          ),

        // -----------------------------------------------------------------
        // Practice review
        // -----------------------------------------------------------------

        getReview: (input: GetReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetReviewInput, input);
            return yield* repo.getReview(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),

        createReview: (input: CreateReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreateReviewInput, input);
            return yield* repo.createReview(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),

        updateReview: (input: UpdateReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateReviewInput, input);
            return yield* repo.updateReview(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
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

            Effect.tapError(Effect.logError),
          ),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PracticeRepo.layer),
  );
}
