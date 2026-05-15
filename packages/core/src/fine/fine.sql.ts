import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { members, organizations, users } from "../auth/auth.sql";

import type { FineEventKind, FineStatus } from "./fine.schema";

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

export const fineEvents = sqliteTable(
  "fine_events",
  {
    id: text("id").primaryKey(),
    fineId: text("fine_id")
      .notNull()
      .references(() => fines.id, { onDelete: "cascade" }),
    kind: text("kind").$type<FineEventKind>().notNull(),
    amountCents: integer("amount_cents").notNull(),
    deltaCents: integer("delta_cents").notNull().default(0),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    at: timestamp("at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    index("fine_events_fine_idx").on(table.fineId),
    index("fine_events_at_idx").on(table.at),
  ],
);

export type Fine = typeof fines.$inferSelect;
export type NewFine = typeof fines.$inferInsert;
export type FineTemplate = typeof fineTemplates.$inferSelect;
export type NewFineTemplate = typeof fineTemplates.$inferInsert;
export type FineEvent = typeof fineEvents.$inferSelect;
export type NewFineEvent = typeof fineEvents.$inferInsert;
