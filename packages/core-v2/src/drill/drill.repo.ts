import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import { Array as Arr, Effect } from "effect";

import { DatabaseLive } from "../drizzle/drizzle.service";

import type {
  CreateDrillInput,
  DeleteDrillInput,
  GetDrillInput,
  UpdateDrillInput,
} from "./drill.schema";
import { drillTable } from "./drill.sql";

export class DrillRepo extends Effect.Service<DrillRepo>()("DrillRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      list: () =>
        db.select().from(drillTable).pipe(Effect.tapError(Effect.logError)),

      get: (input: GetDrillInput) =>
        db
          .select()
          .from(drillTable)
          .where(eq(drillTable.publicId, input.publicId))
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      create: (input: CreateDrillInput) =>
        db
          .insert(drillTable)
          .values({
            name: input.name,
            subtitle: input.subtitle,
            description: input.description,
            difficulty: input.difficulty,
            category: [...(input.category ?? [])],
            positionGroup: [...(input.positionGroup ?? [])],
            intensity: input.intensity,
            contact: input.contact,
            competitive: input.competitive,
            playerCount: input.playerCount,
            durationMinutes: input.durationMinutes,
            fieldSpace: input.fieldSpace,
            equipment: input.equipment ? [...input.equipment] : undefined,
            diagramUrl: input.diagramUrl,
            videoUrl: input.videoUrl,
            coachNotes: input.coachNotes,
            tags: [...(input.tags ?? [])],
          })
          .returning()
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      update: (input: UpdateDrillInput) =>
        db
          .update(drillTable)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.difficulty !== undefined && {
              difficulty: input.difficulty,
            }),
            ...(input.playerCount !== undefined && {
              playerCount: input.playerCount,
            }),
            ...(input.durationMinutes !== undefined && {
              durationMinutes: input.durationMinutes,
            }),
            ...(input.diagramUrl !== undefined && {
              diagramUrl: input.diagramUrl,
            }),
            ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl }),
            ...(input.category !== undefined && {
              category: [...input.category],
            }),
            ...(input.positionGroup !== undefined && {
              positionGroup: [...input.positionGroup],
            }),
            ...(input.intensity !== undefined && {
              intensity: input.intensity,
            }),
            ...(input.contact !== undefined && { contact: input.contact }),
            ...(input.competitive !== undefined && {
              competitive: input.competitive,
            }),
            ...(input.fieldSpace !== undefined && {
              fieldSpace: input.fieldSpace,
            }),
            ...(input.equipment !== undefined && {
              equipment: input.equipment ? [...input.equipment] : null,
            }),
            ...(input.coachNotes !== undefined && {
              coachNotes: input.coachNotes,
            }),
            ...(input.tags !== undefined && { tags: [...input.tags] }),
          })
          .where(eq(drillTable.publicId, input.publicId))
          .returning()
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      delete: (input: DeleteDrillInput) =>
        db
          .delete(drillTable)
          .where(eq(drillTable.publicId, input.publicId))
          .returning()
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
