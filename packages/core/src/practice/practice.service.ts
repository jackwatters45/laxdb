import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError, ValidationError } from "../error";
import { decodeArguments, parseSqlError } from "../util";

import { PracticeRepo } from "./practice.repo";
import {
  Practice,
  PracticeAggregate,
  PracticeEdge,
  PracticeItem,
  PracticeReview,
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
  SavePracticeAggregateInput,
  UpdateItemInput,
  UpdatePracticeInput,
  UpdateReviewInput,
} from "./practice.schema";

const asPractice = (row: typeof Practice.Type) => new Practice(row);
const asItem = (row: typeof PracticeItem.Type) => new PracticeItem(row);
const asEdge = (row: typeof PracticeEdge.Type) => new PracticeEdge(row);
const asReview = (row: typeof PracticeReview.Type) => new PracticeReview(row);

const validateAggregateEdges = (
  itemIds: ReadonlySet<string>,
  edges: ReadonlyArray<{
    readonly sourcePublicId: string;
    readonly targetPublicId: string;
  }>,
) =>
  Effect.gen(function* () {
    for (const edge of edges) {
      if (!itemIds.has(edge.sourcePublicId)) {
        yield* Effect.fail(
          new ValidationError({
            domain: "PracticeAggregate",
            message: `Practice edge source is not in the saved item set: ${edge.sourcePublicId}`,
          }),
        );
      }

      if (!itemIds.has(edge.targetPublicId)) {
        yield* Effect.fail(
          new ValidationError({
            domain: "PracticeAggregate",
            message: `Practice edge target is not in the saved item set: ${edge.targetPublicId}`,
          }),
        );
      }
    }
  });

export class PracticeService extends ServiceMap.Service<PracticeService>()(
  "PracticeService",
  {
    make: Effect.gen(function* () {
      const repo = yield* PracticeRepo;

      const loadAggregateById = (publicId: string) =>
        Effect.gen(function* () {
          const practice = yield* repo.get({ publicId });
          const [items, edges] = yield* Effect.all([
            repo.listItems({ practicePublicId: publicId }),
            repo.listEdges({ practicePublicId: publicId }),
          ]);

          return new PracticeAggregate({
            practice: asPractice(practice),
            items: items.map(asItem),
            edges: edges.map(asEdge),
          });
        });

      return {
        // -----------------------------------------------------------------
        // Practice CRUD
        // -----------------------------------------------------------------

        list: () =>
          repo.list().pipe(
            Effect.map((rows) => rows.map(asPractice)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        get: (input: GetPracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetPracticeInput, input);
            return yield* repo.get(decoded);
          }).pipe(
            Effect.map(asPractice),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        create: (input: CreatePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreatePracticeInput, input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.map(asPractice),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: "new",
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        update: (input: UpdatePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdatePracticeInput, input);
            return yield* repo.update(decoded);
          }).pipe(
            Effect.map(asPractice),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        delete: (input: DeletePracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(DeletePracticeInput, input);
            return yield* repo.delete(decoded);
          }).pipe(
            Effect.map(asPractice),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "Practice",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        // -----------------------------------------------------------------
        // Practice aggregate
        // -----------------------------------------------------------------

        loadAggregate: (input: GetPracticeInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetPracticeInput, input);
            return yield* loadAggregateById(decoded.publicId);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeAggregate",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        saveAggregate: (input: SavePracticeAggregateInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              SavePracticeAggregateInput,
              input,
            );
            const currentItems = yield* repo.listItems({
              practicePublicId: decoded.practicePublicId,
            });
            const existingIds = new Set(
              currentItems.map((item) => item.publicId),
            );
            const desiredIds = new Set(
              decoded.items.map((item) => item.publicId),
            );

            yield* validateAggregateEdges(desiredIds, decoded.edges);

            yield* repo.update({
              publicId: decoded.practicePublicId,
              name: decoded.practice.name,
              date: decoded.practice.date,
              description: decoded.practice.description,
              notes: decoded.practice.notes,
              durationMinutes: decoded.practice.durationMinutes,
              location: decoded.practice.location,
              status: decoded.practice.status,
            });

            for (const item of currentItems) {
              if (!desiredIds.has(item.publicId)) {
                yield* repo.removeItem({ publicId: item.publicId });
              }
            }

            for (const item of decoded.items) {
              if (existingIds.has(item.publicId)) {
                yield* repo.updateItem(item);
              } else {
                yield* repo.addItem({
                  practicePublicId: decoded.practicePublicId,
                  publicId: item.publicId,
                  type: item.type,
                  variant: item.variant,
                  drillPublicId: item.drillPublicId,
                  label: item.label,
                  durationMinutes: item.durationMinutes,
                  notes: item.notes,
                  groups: item.groups,
                  orderIndex: item.orderIndex,
                  positionX: item.positionX,
                  positionY: item.positionY,
                  priority: item.priority,
                });
              }
            }

            yield* repo.replaceEdges({
              practicePublicId: decoded.practicePublicId,
              edges: decoded.edges,
            });

            return yield* loadAggregateById(decoded.practicePublicId);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeAggregate",
                  id: input.practicePublicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
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
            Effect.map((rows) => rows.map(asItem)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        addItem: (input: AddItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(AddItemInput, input);
            return yield* repo.addItem(decoded);
          }).pipe(
            Effect.map(asItem),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeItem",
                  id: "new",
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        updateItem: (input: UpdateItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateItemInput, input);
            return yield* repo.updateItem(decoded);
          }).pipe(
            Effect.map(asItem),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeItem",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        removeItem: (input: RemoveItemInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(RemoveItemInput, input);
            return yield* repo.removeItem(decoded);
          }).pipe(
            Effect.map(asItem),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeItem",
                  id: input.publicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        reorderItems: (input: ReorderItemsInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ReorderItemsInput, input);
            return yield* repo.reorderItems(decoded);
          }).pipe(
            Effect.map((rows) => rows.map(asItem)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        listEdges: (input: ListEdgesInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ListEdgesInput, input);
            return yield* repo.listEdges(decoded);
          }).pipe(
            Effect.map((rows) => rows.map(asEdge)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        replaceEdges: (input: ReplaceEdgesInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ReplaceEdgesInput, input);
            return yield* repo.replaceEdges(decoded);
          }).pipe(
            Effect.map((rows) => rows.map(asEdge)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
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
            Effect.map(asReview),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeReview",
                  id: input.practicePublicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        createReview: (input: CreateReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreateReviewInput, input);
            return yield* repo.createReview(decoded);
          }).pipe(
            Effect.map(asReview),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeReview",
                  id: input.practicePublicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        updateReview: (input: UpdateReviewInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateReviewInput, input);
            return yield* repo.updateReview(decoded);
          }).pipe(
            Effect.map(asReview),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({
                  domain: "PracticeReview",
                  id: input.practicePublicId,
                }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
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
