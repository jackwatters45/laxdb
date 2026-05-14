import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organizations } from "../auth/auth.sql.ts";

export const fineTemplates = sqliteTable(
  "fine_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    amountCents: integer("amount_cents").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    orgIdx: index("fine_templates_org_idx").on(t.organizationId),
  }),
);

export type FineTemplate = typeof fineTemplates.$inferSelect;
export type NewFineTemplate = typeof fineTemplates.$inferInsert;
