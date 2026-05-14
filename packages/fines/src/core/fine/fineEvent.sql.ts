import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "../auth/auth.sql.ts";

import { fines } from "./fine.sql.ts";

export const fineEvents = sqliteTable(
  "fine_events",
  {
    id: text("id").primaryKey(),
    fineId: text("fine_id")
      .notNull()
      .references(() => fines.id, { onDelete: "cascade" }),
    kind: text("kind", {
      enum: ["issued", "paid", "doubled", "forgiven", "adjusted"],
    }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    deltaCents: integer("delta_cents").notNull().default(0),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    at: integer("at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    fineIdx: index("fine_events_fine_idx").on(t.fineId),
    atIdx: index("fine_events_at_idx").on(t.at),
  }),
);

export type FineEvent = typeof fineEvents.$inferSelect;
export type NewFineEvent = typeof fineEvents.$inferInsert;
export type FineEventKind = FineEvent["kind"];
