import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq, getColumns } from "drizzle-orm";
import { Array as Arr, Effect } from "effect";

import { DatabaseLive } from "../drizzle/drizzle.service";

import { playerTable } from "./player.sql";

export class PlayerRepo extends Effect.Service<PlayerRepo>()("PlayerRepo", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...publicColumns } = getColumns(playerTable);

    return {
      list: () =>
        db
          .select(publicColumns)
          .from(playerTable)
          .pipe(Effect.tapError(Effect.logError)),

      getByPublicId: (publicId: string) =>
        db
          .select(publicColumns)
          .from(playerTable)
          .where(eq(playerTable.publicId, publicId))
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      create: (input: { name: string; email: string }) =>
        db
          .insert(playerTable)
          .values({ name: input.name, email: input.email })
          .returning(publicColumns)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      update: (
        publicId: string,
        input: {
          readonly name?: string | undefined;
          readonly email?: string | undefined;
        },
      ) =>
        db
          .update(playerTable)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.email !== undefined && { email: input.email }),
          })
          .where(eq(playerTable.publicId, publicId))
          .returning(publicColumns)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      delete: (publicId: string) =>
        db
          .delete(playerTable)
          .where(eq(playerTable.publicId, publicId))
          .returning(publicColumns)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
