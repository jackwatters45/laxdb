import { index, integer, pgTable, text, unique } from "drizzle-orm/pg-core";

import { ids, timestamp, timestamps } from "../drizzle/drizzle.type";

export const practiceTable = pgTable(
  "practice",
  {
    ...ids,

    name: text("name"),
    date: timestamp("date"),
    description: text("description"),
    notes: text("notes"),
    durationMinutes: integer("duration_minutes"),
    location: text("location"),
    status: text("status")
      .notNull()
      .default("draft")
      .$type<
        "draft" | "scheduled" | "in-progress" | "completed" | "cancelled"
      >(),

    ...timestamps,
  },
  (table) => [
    index("idx_practice_status").on(table.status),
    index("idx_practice_date").on(table.date),
  ],
);

export const practiceItemTable = pgTable(
  "practice_item",
  {
    ...ids,

    practicePublicId: text("practice_public_id").notNull(),
    type: text("type")
      .notNull()
      .$type<"warmup" | "drill" | "cooldown" | "water-break" | "activity">(),
    variant: text("variant")
      .notNull()
      .default("default")
      .$type<"default" | "split">(),
    drillPublicId: text("drill_public_id"),
    label: text("label"),
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),
    groups: text("groups").array().notNull().default(["all"]),
    orderIndex: integer("order_index").notNull().default(0),
    positionX: integer("position_x"),
    positionY: integer("position_y"),
    priority: text("priority")
      .notNull()
      .default("required")
      .$type<"required" | "optional" | "if-time">(),

    ...timestamps,
  },
  (table) => [
    index("idx_practice_item_practice").on(table.practicePublicId),
    index("idx_practice_item_order").on(
      table.practicePublicId,
      table.orderIndex,
    ),
    index("idx_practice_item_drill").on(table.drillPublicId),
  ],
);

export const practiceEdgeTable = pgTable(
  "practice_edge",
  {
    ...ids,

    practicePublicId: text("practice_public_id").notNull(),
    sourcePublicId: text("source_public_id").notNull(),
    targetPublicId: text("target_public_id").notNull(),
    label: text("label"),

    ...timestamps,
  },
  (table) => [
    index("idx_practice_edge_practice").on(table.practicePublicId),
    index("idx_practice_edge_source").on(table.sourcePublicId),
    index("idx_practice_edge_target").on(table.targetPublicId),
  ],
);

export const practiceReviewTable = pgTable(
  "practice_review",
  {
    ...ids,

    practicePublicId: text("practice_public_id").notNull(),
    wentWell: text("went_well"),
    needsImprovement: text("needs_improvement"),
    notes: text("notes"),

    ...timestamps,
  },
  (table) => [unique("uq_practice_review_practice").on(table.practicePublicId)],
);

type PracticeInternal = typeof practiceTable.$inferSelect;
export type Practice = Omit<PracticeInternal, "id">;
export type PracticeInsert = typeof practiceTable.$inferInsert;

type PracticeItemInternal = typeof practiceItemTable.$inferSelect;
export type PracticeItemRow = Omit<PracticeItemInternal, "id">;
export type PracticeItemInsert = typeof practiceItemTable.$inferInsert;

type PracticeEdgeInternal = typeof practiceEdgeTable.$inferSelect;
export type PracticeEdgeRow = Omit<PracticeEdgeInternal, "id">;
export type PracticeEdgeInsert = typeof practiceEdgeTable.$inferInsert;

type PracticeReviewInternal = typeof practiceReviewTable.$inferSelect;
export type PracticeReviewRow = Omit<PracticeReviewInternal, "id">;
export type PracticeReviewInsert = typeof practiceReviewTable.$inferInsert;
