import { integer, pgTable, text } from "drizzle-orm/pg-core";

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
