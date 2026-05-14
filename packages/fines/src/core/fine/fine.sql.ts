import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { members, organizations, users } from "../auth/auth.sql";

import { fineTemplates } from "./fine-template.sql";
import type { FineStatus } from "./fine.schema";

export const fines = sqliteTable(
  "fines",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    templateId: text("template_id").references(() => fineTemplates.id, {
      onDelete: "set null",
    }),
    reason: text("reason").notNull(),
    originalAmountCents: integer("original_amount_cents").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").$type<FineStatus>().notNull().default("unpaid"),
    issuedAt: timestamp("issued_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    dueAt: timestamp("due_at").notNull(),
    paidAt: timestamp("paid_at"),
    issuedByUserId: text("issued_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("fines_org_idx").on(table.organizationId),
    index("fines_member_idx").on(table.memberId),
    index("fines_status_due_idx").on(table.status, table.dueAt),
  ],
);

export type Fine = typeof fines.$inferSelect;
export type NewFine = typeof fines.$inferInsert;
