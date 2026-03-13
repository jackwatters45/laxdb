import { eq, getColumns } from "drizzle-orm";
import { Effect, Layer, ServiceMap } from "effect";

import {
  DatabaseLive,
  headOrFail,
  PgDrizzle,
  query,
} from "../drizzle/drizzle.service";

import type {
  CreateDrillInput,
  DeleteDrillInput,
  GetDrillInput,
  UpdateDrillInput,
} from "./drill.schema";
import { drillTable } from "./drill.sql";

export class DrillRepo extends ServiceMap.Service<DrillRepo>()("DrillRepo", {
  make: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...publicColumns } = getColumns(drillTable);

    return {
      list: () =>
        query(db.select(publicColumns).from(drillTable)).pipe(
          Effect.tapError(Effect.logError),
        ),

      get: (input: GetDrillInput) =>
        query(
          db
            .select(publicColumns)
            .from(drillTable)
            .where(eq(drillTable.publicId, input.publicId)),
        ).pipe(Effect.flatMap(headOrFail)),

      create: (input: CreateDrillInput) =>
        query(
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
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      update: (input: UpdateDrillInput) =>
        query(
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
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      delete: (input: DeleteDrillInput) =>
        query(
          db
            .delete(drillTable)
            .where(eq(drillTable.publicId, input.publicId))
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail)),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(DatabaseLive),
  );
}
