import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "../auth/auth.sql";

import type { FineEventKind } from "./fine.schema";
import { fines } from "./fine.sql";

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

export type FineEvent = typeof fineEvents.$inferSelect;
export type NewFineEvent = typeof fineEvents.$inferInsert;
