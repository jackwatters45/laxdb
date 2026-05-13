import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError, ValidationError } from "../error";
import {
  decodedRowOperation,
  decodedRowsOperation,
  listOperation,
} from "../service-operations";
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

        list: () => listOperation(repo.list(), asPractice),

        get: (input: GetPracticeInput) =>
          decodedRowOperation(GetPracticeInput, input, repo.get, asPractice, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "Practice", id: publicId }),
          }),

        create: (input: CreatePracticeInput) =>
          decodedRowOperation(
            CreatePracticeInput,
            input,
            repo.create,
            asPractice,
            {
              notFound: () =>
                new NotFoundError({ domain: "Practice", id: "new" }),
            },
          ),

        update: (input: UpdatePracticeInput) =>
          decodedRowOperation(
            UpdatePracticeInput,
            input,
            repo.update,
            asPractice,
            {
              notFound: ({ publicId }) =>
                new NotFoundError({ domain: "Practice", id: publicId }),
            },
          ),

        delete: (input: DeletePracticeInput) =>
          decodedRowOperation(
            DeletePracticeInput,
            input,
            repo.delete,
            asPractice,
            {
              notFound: ({ publicId }) =>
                new NotFoundError({ domain: "Practice", id: publicId }),
            },
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
          decodedRowsOperation(ListItemsInput, input, repo.listItems, asItem),

        addItem: (input: AddItemInput) =>
          decodedRowOperation(AddItemInput, input, repo.addItem, asItem, {
            notFound: () =>
              new NotFoundError({ domain: "PracticeItem", id: "new" }),
          }),

        updateItem: (input: UpdateItemInput) =>
          decodedRowOperation(UpdateItemInput, input, repo.updateItem, asItem, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "PracticeItem", id: publicId }),
          }),

        removeItem: (input: RemoveItemInput) =>
          decodedRowOperation(RemoveItemInput, input, repo.removeItem, asItem, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "PracticeItem", id: publicId }),
          }),

        reorderItems: (input: ReorderItemsInput) =>
          decodedRowsOperation(
            ReorderItemsInput,
            input,
            repo.reorderItems,
            asItem,
          ),

        listEdges: (input: ListEdgesInput) =>
          decodedRowsOperation(ListEdgesInput, input, repo.listEdges, asEdge),

        replaceEdges: (input: ReplaceEdgesInput) =>
          decodedRowsOperation(
            ReplaceEdgesInput,
            input,
            repo.replaceEdges,
            asEdge,
          ),

        // -----------------------------------------------------------------
        // Practice review
        // -----------------------------------------------------------------

        getReview: (input: GetReviewInput) =>
          decodedRowOperation(GetReviewInput, input, repo.getReview, asReview, {
            notFound: ({ practicePublicId }) =>
              new NotFoundError({
                domain: "PracticeReview",
                id: practicePublicId,
              }),
          }),

        createReview: (input: CreateReviewInput) =>
          decodedRowOperation(
            CreateReviewInput,
            input,
            repo.createReview,
            asReview,
            {
              notFound: ({ practicePublicId }) =>
                new NotFoundError({
                  domain: "PracticeReview",
                  id: practicePublicId,
                }),
            },
          ),

        updateReview: (input: UpdateReviewInput) =>
          decodedRowOperation(
            UpdateReviewInput,
            input,
            repo.updateReview,
            asReview,
            {
              notFound: ({ practicePublicId }) =>
                new NotFoundError({
                  domain: "PracticeReview",
                  id: practicePublicId,
                }),
            },
          ),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PracticeRepo.layer),
  );
}
