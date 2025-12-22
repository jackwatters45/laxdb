import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { ids, timestamps } from '../../drizzle/drizzle.type';
import { playerTable } from '../player.sql';

export const playerContactInfoTable = pgTable(
  'player_contact_info',
  {
    ...ids,
    playerId: integer('player_id')
      .notNull()
      .references(() => playerTable.id, { onDelete: 'cascade' })
      .unique(),
    email: text('email'),
    phone: text('phone'),
    facebook: text('facebook'),
    instagram: text('instagram'),
    whatsapp: text('whatsapp'),
    linkedin: text('linkedin'),
    groupme: text('groupme'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    ...timestamps,
  },
  (table) => [index('idx_player_contact_info_player').on(table.playerId)]
);

type PlayerContactInfoInternal = typeof playerContactInfoTable.$inferSelect;
export type PlayerContactInfo = Omit<PlayerContactInfoInternal, 'id'>;

export type PlayerContactInfoInsert =
  typeof playerContactInfoTable.$inferInsert;
