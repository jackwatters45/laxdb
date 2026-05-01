import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamp, timestamps } from "../drizzle/drizzle.type";

// Better Auth
export const userTable = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    image: text("image"),
    role: text("role"),
    banned: integer("banned", { mode: "boolean" }).default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    ...timestamps,
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_name_idx").on(table.name),
  ],
);

export type UserSelect = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;
