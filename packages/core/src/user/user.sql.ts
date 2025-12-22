import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamp, timestamps } from '../drizzle/drizzle.type';

// Better Auth
export const userTable = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    role: text('role'),
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    ...timestamps,
  },
  (table) => [
    index('user_email_idx').on(table.email),
    index('user_name_idx').on(table.name),
  ]
);

export type UserSelect = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;
