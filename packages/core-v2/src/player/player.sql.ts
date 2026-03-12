import { index, pgTable, text } from "drizzle-orm/pg-core";

import { ids, timestamps } from "../drizzle/drizzle.type";

export const playerTable = pgTable(
  "player",
  {
    ...ids,
    name: text("name"),
    email: text("email"),
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
