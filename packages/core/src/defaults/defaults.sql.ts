import { index, jsonb, pgTable, text, unique } from "drizzle-orm/pg-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

export const defaultsTable = pgTable(
  "defaults",
  {
    ...ids,

    scopeType: text("scope_type")
      .notNull()
      .$type<"global" | "user" | "team" | "org">(),
    scopeId: text("scope_id").notNull(),
    namespace: text("namespace").notNull(),
    valuesJson: jsonb("values_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    ...timestamps,
  },
  (table) => [
    unique("uq_defaults_scope_namespace").on(
      table.scopeType,
      table.scopeId,
      table.namespace,
    ),
    index("idx_defaults_scope").on(table.scopeType, table.scopeId),
    index("idx_defaults_namespace").on(table.namespace),
  ],
);

type DefaultsInternal = typeof defaultsTable.$inferSelect;
export type DefaultsRow = Omit<DefaultsInternal, "id">;
export type DefaultsInsert = typeof defaultsTable.$inferInsert;
