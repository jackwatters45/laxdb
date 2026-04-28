import { index, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

export const defaultsTable = sqliteTable(
  "defaults",
  {
    ...ids,

    scopeType: text("scope_type")
      .notNull()
      .$type<"global" | "user" | "team" | "org">(),
    scopeId: text("scope_id").notNull(),
    namespace: text("namespace").notNull(),
    valuesJson: text("values_json", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .$defaultFn(() => ({})),

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
