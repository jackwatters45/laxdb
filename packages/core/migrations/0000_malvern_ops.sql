CREATE TABLE IF NOT EXISTS `malvern_teams` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `public_id` text NOT NULL UNIQUE,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `name` text NOT NULL,
  `grade` text,
  `source_url` text,
  `default_recipient_emails` text NOT NULL DEFAULT '[]',
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_teams_org_idx` ON `malvern_teams` (`organization_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `malvern_teams_org_name_uq` ON `malvern_teams` (`organization_id`, `name`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `malvern_team_coaches` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `public_id` text NOT NULL UNIQUE,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `team_public_id` text NOT NULL REFERENCES `malvern_teams`(`public_id`) ON DELETE cascade,
  `coach_user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_team_coaches_org_idx` ON `malvern_team_coaches` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_team_coaches_user_idx` ON `malvern_team_coaches` (`coach_user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `malvern_team_coaches_team_user_uq` ON `malvern_team_coaches` (`team_public_id`, `coach_user_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `malvern_players` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `public_id` text NOT NULL UNIQUE,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `team_public_id` text NOT NULL REFERENCES `malvern_teams`(`public_id`) ON DELETE cascade,
  `name` text NOT NULL,
  `jumper_number` integer,
  `active` integer DEFAULT 1 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_players_org_idx` ON `malvern_players` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_players_team_idx` ON `malvern_players` (`team_public_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `malvern_players_team_name_uq` ON `malvern_players` (`team_public_id`, `name`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `malvern_fixtures` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `public_id` text NOT NULL UNIQUE,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `team_public_id` text NOT NULL REFERENCES `malvern_teams`(`public_id`) ON DELETE cascade,
  `external_fixture_id` text,
  `round_label` text NOT NULL,
  `starts_at` integer,
  `venue` text,
  `opponent` text NOT NULL,
  `home_away` text DEFAULT 'unknown' NOT NULL,
  `malvern_score` integer,
  `opponent_score` integer,
  `source_url` text,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_fixtures_org_idx` ON `malvern_fixtures` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_fixtures_team_idx` ON `malvern_fixtures` (`team_public_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_fixtures_starts_idx` ON `malvern_fixtures` (`starts_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `malvern_fixtures_external_uq` ON `malvern_fixtures` (`team_public_id`, `external_fixture_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `malvern_top_three_submissions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `public_id` text NOT NULL UNIQUE,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `fixture_public_id` text NOT NULL REFERENCES `malvern_fixtures`(`public_id`) ON DELETE cascade,
  `submitted_by_user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade,
  `first_player_public_id` text NOT NULL REFERENCES `malvern_players`(`public_id`) ON DELETE restrict,
  `second_player_public_id` text NOT NULL REFERENCES `malvern_players`(`public_id`) ON DELETE restrict,
  `third_player_public_id` text NOT NULL REFERENCES `malvern_players`(`public_id`) ON DELETE restrict,
  `blurb` text,
  `recipient_emails` text NOT NULL,
  `email_subject` text NOT NULL,
  `email_body` text NOT NULL,
  `emailed_at` integer,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_top_three_org_idx` ON `malvern_top_three_submissions` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_top_three_fixture_idx` ON `malvern_top_three_submissions` (`fixture_public_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `malvern_top_three_submitter_idx` ON `malvern_top_three_submissions` (`submitted_by_user_id`);
