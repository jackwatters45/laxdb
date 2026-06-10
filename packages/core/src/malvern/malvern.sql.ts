import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

import { organizations, users } from "../auth/auth.sql";
import { ids, timestamp, timestamps } from "../drizzle/drizzle.type";

import type { FixtureHomeAway } from "./malvern.schema";

export const malvernTeams = sqliteTable(
  "malvern_teams",
  {
    ...ids,
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    grade: text("grade"),
    sourceUrl: text("source_url"),
    defaultRecipientEmails: text("default_recipient_emails", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    ...timestamps,
  },
  (table) => [
    index("malvern_teams_org_idx").on(table.organizationId),
    unique("malvern_teams_org_name_uq").on(table.organizationId, table.name),
  ],
);

export const malvernTeamCoaches = sqliteTable(
  "malvern_team_coaches",
  {
    ...ids,
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamPublicId: text("team_public_id")
      .notNull()
      .references(() => malvernTeams.publicId, { onDelete: "cascade" }),
    coachUserId: text("coach_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("malvern_team_coaches_org_idx").on(table.organizationId),
    index("malvern_team_coaches_user_idx").on(table.coachUserId),
    unique("malvern_team_coaches_team_user_uq").on(
      table.teamPublicId,
      table.coachUserId,
    ),
  ],
);

export const malvernPlayers = sqliteTable(
  "malvern_players",
  {
    ...ids,
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamPublicId: text("team_public_id")
      .notNull()
      .references(() => malvernTeams.publicId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    jumperNumber: integer("jumper_number"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("malvern_players_org_idx").on(table.organizationId),
    index("malvern_players_team_idx").on(table.teamPublicId),
    unique("malvern_players_team_name_uq").on(table.teamPublicId, table.name),
  ],
);

export const malvernFixtures = sqliteTable(
  "malvern_fixtures",
  {
    ...ids,
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamPublicId: text("team_public_id")
      .notNull()
      .references(() => malvernTeams.publicId, { onDelete: "cascade" }),
    externalFixtureId: text("external_fixture_id"),
    roundLabel: text("round_label").notNull(),
    startsAt: timestamp("starts_at"),
    venue: text("venue"),
    opponent: text("opponent").notNull(),
    homeAway: text("home_away")
      .$type<FixtureHomeAway>()
      .notNull()
      .default("unknown"),
    malvernScore: integer("malvern_score"),
    opponentScore: integer("opponent_score"),
    sourceUrl: text("source_url"),
    ...timestamps,
  },
  (table) => [
    index("malvern_fixtures_org_idx").on(table.organizationId),
    index("malvern_fixtures_team_idx").on(table.teamPublicId),
    index("malvern_fixtures_starts_idx").on(table.startsAt),
    unique("malvern_fixtures_external_uq").on(
      table.teamPublicId,
      table.externalFixtureId,
    ),
  ],
);

export const malvernTopThreeSubmissions = sqliteTable(
  "malvern_top_three_submissions",
  {
    ...ids,
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fixturePublicId: text("fixture_public_id")
      .notNull()
      .references(() => malvernFixtures.publicId, { onDelete: "cascade" }),
    submittedByUserId: text("submitted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    firstPlayerPublicId: text("first_player_public_id")
      .notNull()
      .references(() => malvernPlayers.publicId, { onDelete: "restrict" }),
    secondPlayerPublicId: text("second_player_public_id")
      .notNull()
      .references(() => malvernPlayers.publicId, { onDelete: "restrict" }),
    thirdPlayerPublicId: text("third_player_public_id")
      .notNull()
      .references(() => malvernPlayers.publicId, { onDelete: "restrict" }),
    blurb: text("blurb"),
    recipientEmails: text("recipient_emails", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    emailSubject: text("email_subject").notNull(),
    emailBody: text("email_body").notNull(),
    emailedAt: timestamp("emailed_at"),
    createdAt: timestamp("created_at")
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("malvern_top_three_org_idx").on(table.organizationId),
    index("malvern_top_three_fixture_idx").on(table.fixturePublicId),
    index("malvern_top_three_submitter_idx").on(table.submittedByUserId),
  ],
);

export type MalvernTeamRow = typeof malvernTeams.$inferSelect;
export type NewMalvernTeam = typeof malvernTeams.$inferInsert;
export type MalvernTeamCoachRow = typeof malvernTeamCoaches.$inferSelect;
export type NewMalvernTeamCoach = typeof malvernTeamCoaches.$inferInsert;
export type MalvernPlayerRow = typeof malvernPlayers.$inferSelect;
export type NewMalvernPlayer = typeof malvernPlayers.$inferInsert;
export type MalvernFixtureRow = typeof malvernFixtures.$inferSelect;
export type NewMalvernFixture = typeof malvernFixtures.$inferInsert;
export type MalvernTopThreeSubmissionRow =
  typeof malvernTopThreeSubmissions.$inferSelect;
export type NewMalvernTopThreeSubmission =
  typeof malvernTopThreeSubmissions.$inferInsert;
