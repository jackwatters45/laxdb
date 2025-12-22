import { pgTable, text } from 'drizzle-orm/pg-core';
import { ids, timestamps } from '../drizzle/drizzle.type';

export const feedbackTable = pgTable('feedback', {
  ...ids,
  topic: text('topic').notNull(),
  rating: text('rating').notNull(),
  feedback: text('feedback').notNull(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  ...timestamps,
});

type FeedbackInternal = typeof feedbackTable.$inferSelect;
export type Feedback = Omit<FeedbackInternal, 'id'>;

export type FeedbackInstert = typeof feedbackTable.$inferSelect;
