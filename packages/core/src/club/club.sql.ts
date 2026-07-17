import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { members, organizations } from "../auth/auth.sql";

export const clubTeams = sqliteTable(
  "club_teams",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    coachMemberId: text("coach_member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    index("club_teams_org_idx").on(table.organizationId),
    index("club_teams_coach_idx").on(table.coachMemberId),
  ],
);

export const rosterPlayers = sqliteTable(
  "roster_players",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => clubTeams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    jerseyNumber: integer("jersey_number"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    index("roster_players_org_idx").on(table.organizationId),
    index("roster_players_team_idx").on(table.teamId),
  ],
);

export const reportRecipients = sqliteTable(
  "report_recipients",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => clubTeams.id, {
      onDelete: "cascade",
    }),
    label: text("label").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    index("report_recipients_org_idx").on(table.organizationId),
    uniqueIndex("report_recipients_org_team_email_idx").on(
      table.organizationId,
      table.teamId,
      table.email,
    ),
  ],
);

export type ClubTeam = typeof clubTeams.$inferSelect;
export type NewClubTeam = typeof clubTeams.$inferInsert;
export type RosterPlayer = typeof rosterPlayers.$inferSelect;
export type NewRosterPlayer = typeof rosterPlayers.$inferInsert;
export type ReportRecipient = typeof reportRecipients.$inferSelect;
export type NewReportRecipient = typeof reportRecipients.$inferInsert;
