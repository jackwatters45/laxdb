import { boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

export const drillTable = pgTable(
  "drill",
  {
    ...ids,

    // Core
    name: text("name").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),

    // Classification
    difficulty: text("difficulty")
      .notNull()
      .default("intermediate")
      .$type<"beginner" | "intermediate" | "advanced">(),
    category: text("category")
      .$type<
        | "passing"
        | "shooting"
        | "defense"
        | "ground-balls"
        | "face-offs"
        | "clearing"
        | "riding"
        | "transition"
        | "man-up"
        | "man-down"
        | "conditioning"
      >()
      .array()
      .notNull()
      .default([]),
    positionGroup: text("position_group")
      .$type<"attack" | "midfield" | "defense" | "goalie" | "all">()
      .array()
      .notNull()
      .default([]),
    intensity: text("intensity").$type<"low" | "medium" | "high">(),
    contact: boolean("contact"),
    competitive: boolean("competitive"),

    // Logistics
    playerCount: integer("player_count"),
    durationMinutes: integer("duration_minutes"),
    fieldSpace: text("field_space").$type<
      "full-field" | "half-field" | "box"
    >(),
    equipment: text("equipment").array(),

    // Media
    diagramUrl: text("diagram_url"), // Excalidraw embed URL or image
    videoUrl: text("video_url"), // YouTube/uploaded video link

    // Coach content
    coachNotes: text("coach_notes"),

    // Tags
    tags: text("tags").array().notNull().default([]),

    // Future: variations - could be a separate table or self-referencing drill FKs
    // Future: organizationId - if drills need to be org-scoped instead of public
    // Future: createdBy - user reference for attribution

    ...timestamps,
  },
  (table) => [
    index("idx_drill_difficulty").on(table.difficulty),
    index("idx_drill_name").on(table.name),
  ],
);

type DrillInternal = typeof drillTable.$inferSelect;
export type Drill = Omit<DrillInternal, "id">;
export type DrillInsert = typeof drillTable.$inferInsert;
