import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { asc, eq, getColumns } from "drizzle-orm";
import { Array as Arr, Effect } from "effect";

import { DatabaseLive } from "../drizzle/drizzle.service";

import type {
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
import {
  practiceItemTable,
  practiceReviewTable,
  practiceTable,
} from "./practice.sql";

export class PracticeRepo extends Effect.Service<PracticeRepo>()(
  "PracticeRepo",
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _pid, ...practiceCols } = getColumns(practiceTable);
      const { id: _iid, ...itemCols } = getColumns(practiceItemTable);
      const { id: _rid, ...reviewCols } = getColumns(practiceReviewTable);

      return {
        // -----------------------------------------------------------------
        // Practice CRUD
        // -----------------------------------------------------------------

        list: () =>
          db
            .select(practiceCols)
            .from(practiceTable)
            .pipe(Effect.tapError(Effect.logError)),

        get: (input: GetPracticeInput) =>
          db
            .select(practiceCols)
            .from(practiceTable)
            .where(eq(practiceTable.publicId, input.publicId))
            .pipe(Effect.flatMap(Arr.head)),

        create: (input: CreatePracticeInput) =>
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
            .returning(practiceCols)
            .pipe(Effect.flatMap(Arr.head)),

        update: (input: UpdatePracticeInput) =>
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
              ...(input.location !== undefined && { location: input.location }),
              ...(input.status !== undefined && { status: input.status }),
            })
            .where(eq(practiceTable.publicId, input.publicId))
            .returning(practiceCols)
            .pipe(Effect.flatMap(Arr.head)),

        delete: (input: DeletePracticeInput) =>
          db
            .delete(practiceTable)
            .where(eq(practiceTable.publicId, input.publicId))
            .returning(practiceCols)
            .pipe(Effect.flatMap(Arr.head)),

        // -----------------------------------------------------------------
        // Practice items
        // -----------------------------------------------------------------

        listItems: (input: ListItemsInput) =>
          db
            .select(itemCols)
            .from(practiceItemTable)
            .where(
              eq(practiceItemTable.practicePublicId, input.practicePublicId),
            )
            .orderBy(asc(practiceItemTable.orderIndex))
            .pipe(Effect.tapError(Effect.logError)),

        addItem: (input: AddItemInput) =>
          db
            .insert(practiceItemTable)
            .values({
              practicePublicId: input.practicePublicId,
              type: input.type,
              drillPublicId: input.drillPublicId ?? null,
              label: input.label ?? null,
              durationMinutes: input.durationMinutes ?? null,
              notes: input.notes ?? null,
              groups: [...(input.groups ?? ["all"])],
              orderIndex: input.orderIndex ?? 0,
              priority: input.priority ?? "required",
            })
            .returning(itemCols)
            .pipe(Effect.flatMap(Arr.head)),

        updateItem: (input: UpdateItemInput) =>
          db
            .update(practiceItemTable)
            .set({
              ...(input.type !== undefined && { type: input.type }),
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
              ...(input.priority !== undefined && { priority: input.priority }),
            })
            .where(eq(practiceItemTable.publicId, input.publicId))
            .returning(itemCols)
            .pipe(Effect.flatMap(Arr.head)),

        removeItem: (input: RemoveItemInput) =>
          db
            .delete(practiceItemTable)
            .where(eq(practiceItemTable.publicId, input.publicId))
            .returning(itemCols)
            .pipe(Effect.flatMap(Arr.head)),

        reorderItems: (input: ReorderItemsInput) =>
          Effect.gen(function* () {
            for (const [i, id] of input.orderedIds.entries()) {
              yield* db
                .update(practiceItemTable)
                .set({ orderIndex: i })
                .where(eq(practiceItemTable.publicId, id));
            }
            return yield* db
              .select(itemCols)
              .from(practiceItemTable)
              .where(
                eq(practiceItemTable.practicePublicId, input.practicePublicId),
              )
              .orderBy(asc(practiceItemTable.orderIndex));
          }).pipe(Effect.tapError(Effect.logError)),

        // -----------------------------------------------------------------
        // Practice review
        // -----------------------------------------------------------------

        getReview: (input: GetReviewInput) =>
          db
            .select(reviewCols)
            .from(practiceReviewTable)
            .where(
              eq(practiceReviewTable.practicePublicId, input.practicePublicId),
            )
            .pipe(Effect.flatMap(Arr.head)),

        createReview: (input: CreateReviewInput) =>
          db
            .insert(practiceReviewTable)
            .values({
              practicePublicId: input.practicePublicId,
              wentWell: input.wentWell,
              needsImprovement: input.needsImprovement,
              notes: input.notes,
            })
            .returning(reviewCols)
            .pipe(Effect.flatMap(Arr.head)),

        updateReview: (input: UpdateReviewInput) =>
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
              eq(practiceReviewTable.practicePublicId, input.practicePublicId),
            )
            .returning(reviewCols)
            .pipe(Effect.flatMap(Arr.head)),
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}
