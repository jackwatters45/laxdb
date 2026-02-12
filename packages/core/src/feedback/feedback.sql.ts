import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

export interface Attachment {
  key: string;
  name: string;
  size: number;
  type: string;
}

export const feedbackTable = pgTable("feedback", {
  ...ids,
  feedback: text("feedback").notNull(),
  source: text("source").notNull().default("app"),
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  userId: text("user_id"),
  userEmail: text("user_email"),
  ...timestamps,
});

export type FeedbackRow = Omit<typeof feedbackTable.$inferSelect, "id">;
export type FeedbackInsert = typeof feedbackTable.$inferInsert;
