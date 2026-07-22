import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

import type { PlayDiagramValue } from "./play.schema";

export const playTable = sqliteTable(
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
    tags: text("tags", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),

    // Board and media
    diagram: text("diagram", { mode: "json" }).$type<PlayDiagramValue | null>(),
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
