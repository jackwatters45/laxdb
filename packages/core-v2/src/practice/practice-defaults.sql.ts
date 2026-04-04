import { integer, pgTable, text } from "drizzle-orm/pg-core";
// Legacy table kept in schema for a follow-up cleanup migration. Runtime code
// now reads and writes generic defaults via the `defaults` table instead.

import { ids, timestamps } from "../drizzle/drizzle.type";

export const practiceDefaultsTable = pgTable("practice_defaults", {
  ...ids,

  durationMinutes: integer("duration_minutes"),
  location: text("location"),

  ...timestamps,
});

type PracticeDefaultsInternal = typeof practiceDefaultsTable.$inferSelect;
export type PracticeDefaults = Omit<PracticeDefaultsInternal, "id">;
export type PracticeDefaultsInsert = typeof practiceDefaultsTable.$inferInsert;
