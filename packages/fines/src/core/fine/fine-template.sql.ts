import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organizations } from "../auth/auth.sql";

export const fineTemplates = sqliteTable(
  "fine_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    amountCents: integer("amount_cents").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [index("fine_templates_org_idx").on(table.organizationId)],
);

export type FineTemplate = typeof fineTemplates.$inferSelect;
export type NewFineTemplate = typeof fineTemplates.$inferInsert;
