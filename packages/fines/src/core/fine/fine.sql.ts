import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { members, organizations, users } from "../auth/auth.sql.ts";

import { fineTemplates } from "./fineTemplate.sql.ts";

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
    status: text("status", { enum: ["unpaid", "paid", "forgiven"] })
      .notNull()
      .default("unpaid"),
    issuedAt: integer("issued_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    issuedByUserId: text("issued_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    orgIdx: index("fines_org_idx").on(t.organizationId),
    memberIdx: index("fines_member_idx").on(t.memberId),
    statusDueIdx: index("fines_status_due_idx").on(t.status, t.dueAt),
  }),
);

export type Fine = typeof fines.$inferSelect;
export type NewFine = typeof fines.$inferInsert;
export type FineStatus = Fine["status"];
