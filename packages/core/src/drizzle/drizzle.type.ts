import { timestamp as pgTimestamp, serial, varchar } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const ids = {
  get id() {
    return serial('id').primaryKey();
  },
  get publicId() {
    return varchar('public_id', { length: 12 })
      .unique()
      .notNull()
      .$defaultFn(() => nanoid(12));
  },
};

export const timestamp = (name: string) =>
  pgTimestamp(name, {
    mode: 'date',
    precision: 3,
  });

export const timestamps = {
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$onUpdate(
    () => /* @__PURE__ */ new Date()
  ),
  deletedAt: timestamp('deleted_at'),
};
