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
    difficulty: text("difficulty").notNull().default("intermediate"),
    // Values: 'beginner' | 'intermediate' | 'advanced'
    category: text("category").array().notNull().default([]),
    // Values: passing, shooting, defense, ground balls, face-offs, clearing, riding, transition, man-up, man-down, conditioning
    positionGroup: text("position_group").array().notNull().default([]),
    // Values: attack, midfield, defense, goalie, all
    intensity: text("intensity"),
    // Values: low, medium, high
    contact: boolean("contact"),
    // true = pads/contact, false = no contact
    competitive: boolean("competitive"),
    // true = game-like/competitive, false = skill rep

    // Logistics
    playerCount: integer("player_count"), // minimum players needed
    durationMinutes: integer("duration_minutes"), // estimated time
    fieldSpace: text("field_space"),
    // Values: full-field, half-field, box
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
