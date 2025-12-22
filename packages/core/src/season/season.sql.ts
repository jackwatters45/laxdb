import { index, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { ids, timestamp, timestamps } from '../drizzle/drizzle.type';
import { organizationTable } from '../organization/organization.sql';
import { teamTable } from '../team/team.sql';

export const seasonStatusEnum = pgEnum('status', [
  'active',
  'completed',
  'upcoming',
]);

export const seasonTable = pgTable(
  'season',
  {
    ...ids,
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'cascade' }),
    teamId: text('team_id')
      .notNull()
      .references(() => teamTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    status: seasonStatusEnum('status').notNull().default('active'),
    division: text('division'),
    ...timestamps,
  },
  (table) => [
    index('idx_season_organization').on(table.organizationId),
    index('idx_season_team').on(table.teamId),
  ]
);

type SeasonInternal = typeof seasonTable.$inferSelect;
export type SeasonSelect = Omit<SeasonInternal, 'id'>;

export type SeasonInsert = typeof seasonTable.$inferInsert;
