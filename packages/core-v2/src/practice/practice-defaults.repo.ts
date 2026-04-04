import { eq, getColumns } from "drizzle-orm";
import { Effect, Layer, ServiceMap } from "effect";

import { PgDrizzle, query } from "../drizzle/drizzle.service";

import type { UpsertPracticeDefaultsInput } from "./practice-defaults.schema";
import { practiceDefaultsTable } from "./practice-defaults.sql";

export class PracticeDefaultsRepo extends ServiceMap.Service<PracticeDefaultsRepo>()(
  "PracticeDefaultsRepo",
  {
    make: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _id, ...cols } = getColumns(practiceDefaultsTable);

      return {
        get: () =>
          query(db.select(cols).from(practiceDefaultsTable)).pipe(
            Effect.map((rows) => rows[0] ?? null),
          ),

        upsert: (input: UpsertPracticeDefaultsInput) =>
          Effect.gen(function* () {
            const existing = yield* query(
              db.select(cols).from(practiceDefaultsTable),
            );

            if (existing[0]) {
              const rows = yield* query(
                db
                  .update(practiceDefaultsTable)
                  .set({
                    ...(input.durationMinutes !== undefined && {
                      durationMinutes: input.durationMinutes,
                    }),
                    ...(input.location !== undefined && {
                      location: input.location,
                    }),
                  })
                  .where(
                    eq(practiceDefaultsTable.publicId, existing[0].publicId),
                  )
                  .returning(cols),
              );
              return rows[0]!;
            }

            const rows = yield* query(
              db
                .insert(practiceDefaultsTable)
                .values({
                  durationMinutes: input.durationMinutes ?? null,
                  location: input.location ?? null,
                })
                .returning(cols),
            );
            return rows[0]!;
          }),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
