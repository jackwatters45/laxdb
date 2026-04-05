import { asc, eq, getColumns } from "drizzle-orm";
import { Effect, Layer, ServiceMap } from "effect";

import { headOrFail, PgDrizzle, query } from "../drizzle/drizzle.service";

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
} from "./practice.schema";
import {
  practiceEdgeTable,
  practiceItemTable,
  practiceReviewTable,
  practiceTable,
} from "./practice.sql";

export class PracticeRepo extends ServiceMap.Service<PracticeRepo>()(
  "PracticeRepo",
  {
    make: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _pid, ...practiceCols } = getColumns(practiceTable);
      const { id: _iid, ...itemCols } = getColumns(practiceItemTable);
      const { id: _eid, ...edgeCols } = getColumns(practiceEdgeTable);
      const { id: _rid, ...reviewCols } = getColumns(practiceReviewTable);

      return {
        // -----------------------------------------------------------------
        // Practice CRUD
        // -----------------------------------------------------------------

        list: () =>
          query(db.select(practiceCols).from(practiceTable)).pipe(
            Effect.tapError(Effect.logError),
          ),

        get: (input: GetPracticeInput) =>
          query(
            db
              .select(practiceCols)
              .from(practiceTable)
              .where(eq(practiceTable.publicId, input.publicId)),
          ).pipe(Effect.flatMap(headOrFail)),

        create: (input: CreatePracticeInput) =>
          query(
            db
              .insert(practiceTable)
              .values({
                name: input.name,
                date: input.date,
                description: input.description,
                notes: input.notes,
                durationMinutes: input.durationMinutes,
                location: input.location,
                status: input.status,
              })
              .returning(practiceCols),
          ).pipe(Effect.flatMap(headOrFail)),

        update: (input: UpdatePracticeInput) =>
          query(
            db
              .update(practiceTable)
              .set({
                ...(input.name !== undefined && { name: input.name }),
                ...(input.date !== undefined && { date: input.date }),
                ...(input.description !== undefined && {
                  description: input.description,
                }),
                ...(input.notes !== undefined && { notes: input.notes }),
                ...(input.durationMinutes !== undefined && {
                  durationMinutes: input.durationMinutes,
                }),
                ...(input.location !== undefined && {
                  location: input.location,
                }),
                ...(input.status !== undefined && { status: input.status }),
              })
              .where(eq(practiceTable.publicId, input.publicId))
              .returning(practiceCols),
          ).pipe(Effect.flatMap(headOrFail)),

        delete: (input: DeletePracticeInput) =>
          query(
            db
              .delete(practiceTable)
              .where(eq(practiceTable.publicId, input.publicId))
              .returning(practiceCols),
          ).pipe(Effect.flatMap(headOrFail)),

        // -----------------------------------------------------------------
        // Practice items
        // -----------------------------------------------------------------

        listItems: (input: ListItemsInput) =>
          query(
            db
              .select(itemCols)
              .from(practiceItemTable)
              .where(
                eq(practiceItemTable.practicePublicId, input.practicePublicId),
              )
              .orderBy(asc(practiceItemTable.orderIndex)),
          ).pipe(Effect.tapError(Effect.logError)),

        addItem: (input: AddItemInput) =>
          query(
            db
              .insert(practiceItemTable)
              .values({
                practicePublicId: input.practicePublicId,
                type: input.type,
                variant: input.variant ?? "default",
                drillPublicId: input.drillPublicId ?? null,
                label: input.label ?? null,
                durationMinutes: input.durationMinutes ?? null,
                notes: input.notes ?? null,
                groups: [...(input.groups ?? ["all"])],
                orderIndex: input.orderIndex ?? 0,
                positionX: input.positionX ?? null,
                positionY: input.positionY ?? null,
                priority: input.priority ?? "required",
              })
              .returning(itemCols),
          ).pipe(Effect.flatMap(headOrFail)),

        updateItem: (input: UpdateItemInput) =>
          query(
            db
              .update(practiceItemTable)
              .set({
                ...(input.type !== undefined && { type: input.type }),
                ...(input.variant !== undefined && { variant: input.variant }),
                ...(input.drillPublicId !== undefined && {
                  drillPublicId: input.drillPublicId,
                }),
                ...(input.label !== undefined && { label: input.label }),
                ...(input.durationMinutes !== undefined && {
                  durationMinutes: input.durationMinutes,
                }),
                ...(input.notes !== undefined && { notes: input.notes }),
                ...(input.groups !== undefined && {
                  groups: [...input.groups],
                }),
                ...(input.orderIndex !== undefined && {
                  orderIndex: input.orderIndex,
                }),
                ...(input.positionX !== undefined && {
                  positionX: input.positionX,
                }),
                ...(input.positionY !== undefined && {
                  positionY: input.positionY,
                }),
                ...(input.priority !== undefined && {
                  priority: input.priority,
                }),
              })
              .where(eq(practiceItemTable.publicId, input.publicId))
              .returning(itemCols),
          ).pipe(Effect.flatMap(headOrFail)),

        removeItem: (input: RemoveItemInput) =>
          query(
            db
              .delete(practiceItemTable)
              .where(eq(practiceItemTable.publicId, input.publicId))
              .returning(itemCols),
          ).pipe(Effect.flatMap(headOrFail)),

        reorderItems: (input: ReorderItemsInput) =>
          Effect.gen(function* () {
            for (const [i, id] of input.orderedIds.entries()) {
              yield* query(
                db
                  .update(practiceItemTable)
                  .set({ orderIndex: i })
                  .where(eq(practiceItemTable.publicId, id)),
              );
            }
            return yield* query(
              db
                .select(itemCols)
                .from(practiceItemTable)
                .where(
                  eq(
                    practiceItemTable.practicePublicId,
                    input.practicePublicId,
                  ),
                )
                .orderBy(asc(practiceItemTable.orderIndex)),
            );
          }).pipe(Effect.tapError(Effect.logError)),

        listEdges: (input: ListEdgesInput) =>
          query(
            db
              .select(edgeCols)
              .from(practiceEdgeTable)
              .where(
                eq(practiceEdgeTable.practicePublicId, input.practicePublicId),
              )
              .orderBy(asc(practiceEdgeTable.createdAt)),
          ).pipe(Effect.tapError(Effect.logError)),

        replaceEdges: (input: ReplaceEdgesInput) =>
          Effect.gen(function* () {
            yield* query(
              db
                .delete(practiceEdgeTable)
                .where(
                  eq(
                    practiceEdgeTable.practicePublicId,
                    input.practicePublicId,
                  ),
                ),
            );

            if (input.edges.length === 0) {
              return [];
            }

            return yield* query(
              db
                .insert(practiceEdgeTable)
                .values(
                  input.edges.map((edge) => ({
                    practicePublicId: input.practicePublicId,
                    sourcePublicId: edge.sourcePublicId,
                    targetPublicId: edge.targetPublicId,
                    label: edge.label ?? null,
                  })),
                )
                .returning(edgeCols),
            );
          }).pipe(Effect.tapError(Effect.logError)),

        // -----------------------------------------------------------------
        // Practice review
        // -----------------------------------------------------------------

        getReview: (input: GetReviewInput) =>
          query(
            db
              .select(reviewCols)
              .from(practiceReviewTable)
              .where(
                eq(
                  practiceReviewTable.practicePublicId,
                  input.practicePublicId,
                ),
              ),
          ).pipe(Effect.flatMap(headOrFail)),

        createReview: (input: CreateReviewInput) =>
          query(
            db
              .insert(practiceReviewTable)
              .values({
                practicePublicId: input.practicePublicId,
                wentWell: input.wentWell,
                needsImprovement: input.needsImprovement,
                notes: input.notes,
              })
              .returning(reviewCols),
          ).pipe(Effect.flatMap(headOrFail)),

        updateReview: (input: UpdateReviewInput) =>
          query(
            db
              .update(practiceReviewTable)
              .set({
                ...(input.wentWell !== undefined && {
                  wentWell: input.wentWell,
                }),
                ...(input.needsImprovement !== undefined && {
                  needsImprovement: input.needsImprovement,
                }),
                ...(input.notes !== undefined && { notes: input.notes }),
              })
              .where(
                eq(
                  practiceReviewTable.practicePublicId,
                  input.practicePublicId,
                ),
              )
              .returning(reviewCols),
          ).pipe(Effect.flatMap(headOrFail)),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
