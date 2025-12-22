import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { ids, timestamps } from '../drizzle/drizzle.type';
import { organizationTable } from '../organization/organization.sql';
import { teamTable } from '../team/team.sql';
import { userTable } from '../user/user.sql';

export const playerTable = pgTable(
  'player',
  {
    ...ids,
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => userTable.id, {
      onDelete: 'set null',
    }),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    dateOfBirth: text('date_of_birth'),
    ...timestamps,
  },
  (table) => [
    index('idx_player_organization').on(table.organizationId),
    index('idx_player_name').on(table.name),
    index('idx_player_email').on(table.email),
  ]
);

type PlayerInternal = typeof playerTable.$inferSelect;
export type Player = Omit<PlayerInternal, 'id'>;

export type PlayerInsert = typeof playerTable.$inferInsert;

export const teamPlayerTable = pgTable(
  'team_player',
  {
    ...ids,
    teamId: text('team_id')
      .notNull()
      .references(() => teamTable.id, { onDelete: 'cascade' }),
    playerId: integer('player_id')
      .notNull()
      .references(() => playerTable.id, { onDelete: 'cascade' }),
    jerseyNumber: integer('jersey_number'),
    position: text('position'),
    ...timestamps,
  },
  (table) => [
    index('idx_team_player_team').on(table.teamId),
    index('idx_team_player_player').on(table.playerId),
    index('idx_team_player_unique').on(table.teamId, table.playerId),
  ]
);

type TeamPlayerInternal = typeof teamPlayerTable.$inferSelect;
export type TeamPlayer = Omit<TeamPlayerInternal, 'id' | 'playerId'>;
