import { index, pgTable, text } from "drizzle-orm/pg-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

export const playTable = pgTable(
  "play",
  {
    ...ids,

    // Core
    name: text("name").notNull(),
    category: text("category")
      .notNull()
      .$type<
        | "offense"
        | "defense"
        | "clear"
        | "ride"
        | "faceoff"
        | "emo"
        | "man-down"
        | "transition"
      >(),
    formation: text("formation"),
    description: text("description"),
    personnelNotes: text("personnel_notes"),

    // Tags
    tags: text("tags").array().notNull().default([]),

    // Media
    diagramUrl: text("diagram_url"),
    videoUrl: text("video_url"),

    ...timestamps,
  },
  (table) => [
    index("idx_play_category").on(table.category),
    index("idx_play_name").on(table.name),
  ],
);

type PlayInternal = typeof playTable.$inferSelect;
export type Play = Omit<PlayInternal, "id">;
export type PlayInsert = typeof playTable.$inferInsert;
