import { eq, getColumns } from "drizzle-orm";
import { Effect, Layer, ServiceMap } from "effect";

import { headOrFail, DrizzleService, query } from "../drizzle/drizzle.service";

import { playerTable } from "./player.sql";

export class PlayerRepo extends ServiceMap.Service<PlayerRepo>()("PlayerRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;

    const { id: _, ...publicColumns } = getColumns(playerTable);

    return {
      list: () =>
        query(db.select(publicColumns).from(playerTable)).pipe(
          Effect.tapError(Effect.logError),
        ),

      getByPublicId: (publicId: string) =>
        query(
          db
            .select(publicColumns)
            .from(playerTable)
            .where(eq(playerTable.publicId, publicId)),
        ).pipe(Effect.flatMap(headOrFail), Effect.tapError(Effect.logError)),

      create: (input: { name: string; email: string }) =>
        query(
          db
            .insert(playerTable)
            .values({ name: input.name, email: input.email })
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail), Effect.tapError(Effect.logError)),

      update: (
        publicId: string,
        input: {
          readonly name?: string | undefined;
          readonly email?: string | undefined;
        },
      ) =>
        query(
          db
            .update(playerTable)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.email !== undefined && { email: input.email }),
            })
            .where(eq(playerTable.publicId, publicId))
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail), Effect.tapError(Effect.logError)),

      delete: (publicId: string) =>
        query(
          db
            .delete(playerTable)
            .where(eq(playerTable.publicId, publicId))
            .returning(publicColumns),
        ).pipe(Effect.flatMap(headOrFail), Effect.tapError(Effect.logError)),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
