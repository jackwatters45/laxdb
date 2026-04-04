import { eq, getColumns } from "drizzle-orm";
import { Effect, Layer, ServiceMap } from "effect";

import { headOrFail, PgDrizzle, query } from "../drizzle/drizzle.service";

import type {
  CreatePlayInput,
  DeletePlayInput,
  GetPlayInput,
  UpdatePlayInput,
} from "./play.schema";
import { playTable } from "./play.sql";

export class PlayRepo extends ServiceMap.Service<PlayRepo>()("PlayRepo", {
  make: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...publicColumns } = getColumns(playTable);

    return {
      list: () =>
        query(db.select(publicColumns).from(playTable)).pipe(
          Effect.tapError(Effect.logError),
        ),

      get: (input: GetPlayInput) =>
        query(
          db
            .select(publicColumns)
            .from(playTable)
            .where(eq(playTable.publicId, input.publicId)),
        ).pipe(Effect.flatMap(headOrFail)),

      create: (input: CreatePlayInput) =>
        query(
          db
            .insert(playTable)
            .values({
              name: input.name,
              category: input.category,
              formation: input.formation,
              description: input.description,
              personnelNotes: input.personnelNotes,
              tags: [...(input.tags ?? [])],
              diagramUrl: input.diagramUrl,
              videoUrl: input.videoUrl,
            })
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      update: (input: UpdatePlayInput) =>
        query(
          db
            .update(playTable)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.category !== undefined && {
                category: input.category,
              }),
              ...(input.formation !== undefined && {
                formation: input.formation,
              }),
              ...(input.description !== undefined && {
                description: input.description,
              }),
              ...(input.personnelNotes !== undefined && {
                personnelNotes: input.personnelNotes,
              }),
              ...(input.tags !== undefined && { tags: [...input.tags] }),
              ...(input.diagramUrl !== undefined && {
                diagramUrl: input.diagramUrl,
              }),
              ...(input.videoUrl !== undefined && {
                videoUrl: input.videoUrl,
              }),
            })
            .where(eq(playTable.publicId, input.publicId))
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      delete: (input: DeletePlayInput) =>
        query(
          db
            .delete(playTable)
            .where(eq(playTable.publicId, input.publicId))
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail)),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
