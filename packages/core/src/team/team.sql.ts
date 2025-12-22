import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamp } from '../drizzle/drizzle.type';
import { organizationTable } from '../organization/organization.sql';
import { userTable } from '../user/user.sql';

// Better Auth
export const teamTable = pgTable(
  'team',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(
      () => /* @__PURE__ */ new Date()
    ),
  },
  (table) => [
    index('team_organization_id_idx').on(table.organizationId),
    index('team_name_idx').on(table.name),
    index('team_created_at_idx').on(table.createdAt),
  ]
);

// Better Auth
export const teamMemberTable = pgTable(
  'team_member',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teamTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at'),
  },
  (table) => [
    index('team_member_team_id_idx').on(table.teamId),
    index('team_member_user_id_idx').on(table.userId),
    index('team_member_team_user_idx').on(table.teamId, table.userId),
  ]
);
