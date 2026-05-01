import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

export const playerTable = sqliteTable(
  "player",
  {
    ...ids,
    name: text("name").notNull(),
    email: text("email").notNull(),
    ...timestamps,
  },
  (table) => [
    index("idx_player_name").on(table.name),
    index("idx_player_email").on(table.email),
  ],
);

type PlayerInternal = typeof playerTable.$inferSelect;
export type Player = Omit<PlayerInternal, "id">;

export type PlayerInsert = typeof playerTable.$inferInsert;
