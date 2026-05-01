import { integer, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const ids = {
  get id() {
    return integer("id").primaryKey({ autoIncrement: true });
  },
  get publicId() {
    return text("public_id")
      .unique()
      .notNull()
      .$defaultFn(() => nanoid(12));
  },
};

export const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" });

export const timestamps = {
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdate(
    () => /* @__PURE__ */ new Date(),
  ),
};
