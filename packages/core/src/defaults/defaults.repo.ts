import { and, eq, getColumns } from "drizzle-orm";
import { Effect, Layer, ServiceMap } from "effect";

import { PgDrizzle, query } from "../drizzle/drizzle.service";

import type {
  GetDefaultsNamespaceInput,
  PatchDefaultsNamespaceInput,
} from "./defaults.schema";
import { defaultsTable } from "./defaults.sql";

const firstRowOrDie = <A>(rows: readonly A[]) =>
  rows[0] === undefined
    ? Effect.die(new Error("Expected a returned row"))
    : Effect.succeed(rows[0]);

export class DefaultsRepo extends ServiceMap.Service<DefaultsRepo>()(
  "DefaultsRepo",
  {
    make: Effect.gen(function* () {
      const db = yield* PgDrizzle;
      const { id: _id, ...cols } = getColumns(defaultsTable);

      return {
        getNamespace: (input: GetDefaultsNamespaceInput) =>
          query(
            db
              .select(cols)
              .from(defaultsTable)
              .where(
                and(
                  eq(defaultsTable.scopeType, input.scopeType),
                  eq(defaultsTable.scopeId, input.scopeId),
                  eq(defaultsTable.namespace, input.namespace),
                ),
              ),
          ).pipe(Effect.map((rows) => rows[0] ?? null)),

        patchNamespace: (input: PatchDefaultsNamespaceInput) =>
          Effect.gen(function* () {
            const existing = yield* query(
              db
                .select(cols)
                .from(defaultsTable)
                .where(
                  and(
                    eq(defaultsTable.scopeType, input.scopeType),
                    eq(defaultsTable.scopeId, input.scopeId),
                    eq(defaultsTable.namespace, input.namespace),
                  ),
                ),
            ).pipe(Effect.map((rows) => rows[0] ?? null));

            const nextValues = {
              ...existing?.valuesJson,
              ...input.values,
            };

            if (existing) {
              return yield* query(
                db
                  .update(defaultsTable)
                  .set({ valuesJson: nextValues })
                  .where(eq(defaultsTable.publicId, existing.publicId))
                  .returning(cols),
              ).pipe(Effect.flatMap(firstRowOrDie));
            }

            return yield* query(
              db
                .insert(defaultsTable)
                .values({
                  scopeType: input.scopeType,
                  scopeId: input.scopeId,
                  namespace: input.namespace,
                  valuesJson: nextValues,
                })
                .returning(cols),
            ).pipe(Effect.flatMap(firstRowOrDie));
          }),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
