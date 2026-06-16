CREATE TABLE IF NOT EXISTS `defaults` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `scope_type` text NOT NULL,
  `scope_id` text NOT NULL,
  `namespace` text NOT NULL,
  `values_json` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer,
  CONSTRAINT `uq_defaults_scope_namespace` UNIQUE(`scope_type`,`scope_id`,`namespace`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `drill` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `subtitle` text,
  `description` text,
  `difficulty` text DEFAULT 'intermediate' NOT NULL,
  `category` text NOT NULL,
  `position_group` text NOT NULL,
  `intensity` text,
  `contact` integer,
  `competitive` integer,
  `player_count` integer,
  `duration_minutes` integer,
  `field_space` text,
  `equipment` text,
  `diagram_url` text,
  `video_url` text,
  `coach_notes` text,
  `tags` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `play` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `category` text NOT NULL,
  `formation` text,
  `description` text,
  `personnel_notes` text,
  `tags` text NOT NULL,
  `diagram_url` text,
  `video_url` text,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `player` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `practice` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `name` text,
  `date` integer,
  `description` text,
  `notes` text,
  `duration_minutes` integer,
  `location` text,
  `status` text DEFAULT 'draft' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `practice_item` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `practice_public_id` text NOT NULL,
  `type` text NOT NULL,
  `variant` text DEFAULT 'default' NOT NULL,
  `drill_public_id` text,
  `label` text,
  `duration_minutes` integer,
  `notes` text,
  `groups` text NOT NULL,
  `order_index` integer DEFAULT 0 NOT NULL,
  `position_x` integer,
  `position_y` integer,
  `priority` text DEFAULT 'required' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `practice_edge` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `practice_public_id` text NOT NULL,
  `source_public_id` text NOT NULL,
  `target_public_id` text NOT NULL,
  `label` text,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `practice_review` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `public_id` text NOT NULL UNIQUE,
  `practice_public_id` text NOT NULL CONSTRAINT `uq_practice_review_practice` UNIQUE,
  `went_well` text,
  `needs_improvement` text,
  `notes` text,
  `created_at` integer NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
  `id` text PRIMARY KEY,
  `name` text NOT NULL,
  `email` text NOT NULL UNIQUE,
  `email_verified` integer DEFAULT false NOT NULL,
  `image` text,
  `role` text,
  `banned` integer DEFAULT false,
  `ban_reason` text,
  `ban_expires` integer,
  `created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  `updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
  `id` text PRIMARY KEY,
  `expires_at` integer NOT NULL,
  `token` text NOT NULL UNIQUE,
  `created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  `updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  `ip_address` text,
  `user_agent` text,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade,
  `active_organization_id` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `account` (
  `id` text PRIMARY KEY,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  `updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
  `id` text PRIMARY KEY,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  `updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `organization` (
  `id` text PRIMARY KEY,
  `name` text NOT NULL,
  `slug` text UNIQUE,
  `logo` text,
  `metadata` text,
  `created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `member` (
  `id` text PRIMARY KEY,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade,
  `role` text DEFAULT 'member' NOT NULL,
  `created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invitation` (
  `id` text PRIMARY KEY,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `email` text NOT NULL,
  `role` text,
  `status` text DEFAULT 'pending' NOT NULL,
  `expires_at` integer NOT NULL,
  `inviter_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fine_templates` (
  `id` text PRIMARY KEY,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `label` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fines` (
  `id` text PRIMARY KEY,
  `organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
  `member_id` text NOT NULL REFERENCES `member`(`id`) ON DELETE cascade,
  `template_id` text REFERENCES `fine_templates`(`id`) ON DELETE set null,
  `reason` text NOT NULL,
  `original_amount_cents` integer NOT NULL,
  `amount_cents` integer NOT NULL,
  `status` text DEFAULT 'unpaid' NOT NULL,
  `issued_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `due_at` integer NOT NULL,
  `paid_at` integer,
  `issued_by_user_id` text REFERENCES `user`(`id`) ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fine_events` (
  `id` text PRIMARY KEY,
  `fine_id` text NOT NULL REFERENCES `fines`(`id`) ON DELETE cascade,
  `kind` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `delta_cents` integer DEFAULT 0 NOT NULL,
  `actor_user_id` text REFERENCES `user`(`id`) ON DELETE set null,
  `note` text,
  `at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_defaults_scope` ON `defaults` (`scope_type`,`scope_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_defaults_namespace` ON `defaults` (`namespace`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_drill_difficulty` ON `drill` (`difficulty`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_drill_name` ON `drill` (`name`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_play_category` ON `play` (`category`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_play_name` ON `play` (`name`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_player_name` ON `player` (`name`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_player_email` ON `player` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_edge_practice` ON `practice_edge` (`practice_public_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_edge_source` ON `practice_edge` (`source_public_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_edge_target` ON `practice_edge` (`target_public_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_item_practice` ON `practice_item` (`practice_public_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_item_order` ON `practice_item` (`practice_public_id`,`order_index`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_item_drill` ON `practice_item` (`drill_public_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_status` ON `practice` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_practice_date` ON `practice` (`date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_email_idx` ON `user` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_name_idx` ON `user` (`name`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_user_idx` ON `session` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `account_user_idx` ON `account` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `verification_identifier_idx` ON `verification` (`identifier`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `member_org_idx` ON `member` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `member_user_idx` ON `member` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invitation_org_idx` ON `invitation` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invitation_email_idx` ON `invitation` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fine_templates_org_idx` ON `fine_templates` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fines_org_idx` ON `fines` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fines_member_idx` ON `fines` (`member_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fines_status_due_idx` ON `fines` (`status`,`due_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fine_events_fine_idx` ON `fine_events` (`fine_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fine_events_at_idx` ON `fine_events` (`at`);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `club_teams` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`gameday_comp_id` text,
	`gameday_team_id` text,
	`coach_member_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_club_teams_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_teams_coach_member_id_member_id_fk` FOREIGN KEY (`coach_member_id`) REFERENCES `member`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `report_recipients` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`team_id` text,
	`label` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_report_recipients_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_report_recipients_team_id_club_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `club_teams`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `roster_players` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`jersey_number` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_roster_players_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_roster_players_team_id_club_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `club_teams`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fixtures` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`team_id` text NOT NULL,
	`gameday_fixture_id` text NOT NULL,
	`comp_id` text,
	`comp_name` text,
	`round` text,
	`scheduled_at` integer,
	`home_team_name` text NOT NULL,
	`away_team_name` text NOT NULL,
	`is_home` integer DEFAULT true NOT NULL,
	`venue_name` text,
	`match_status` text,
	`home_score` integer,
	`away_score` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_fixtures_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fixtures_team_id_club_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `club_teams`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `match_reports` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`fixture_id` text NOT NULL,
	`team_id` text NOT NULL,
	`submitted_by_user_id` text,
	`top_player_1_id` text NOT NULL,
	`top_player_2_id` text,
	`top_player_3_id` text,
	`blurb` text,
	`sent_to` text DEFAULT '[]' NOT NULL,
	`sent_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_match_reports_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_match_reports_fixture_id_fixtures_id_fk` FOREIGN KEY (`fixture_id`) REFERENCES `fixtures`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_match_reports_team_id_club_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `club_teams`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_match_reports_submitted_by_user_id_user_id_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_match_reports_top_player_1_id_roster_players_id_fk` FOREIGN KEY (`top_player_1_id`) REFERENCES `roster_players`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_match_reports_top_player_2_id_roster_players_id_fk` FOREIGN KEY (`top_player_2_id`) REFERENCES `roster_players`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_match_reports_top_player_3_id_roster_players_id_fk` FOREIGN KEY (`top_player_3_id`) REFERENCES `roster_players`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `club_teams_org_idx` ON `club_teams` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `club_teams_coach_idx` ON `club_teams` (`coach_member_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `report_recipients_org_idx` ON `report_recipients` (`organization_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `report_recipients_org_team_email_idx` ON `report_recipients` (`organization_id`,`team_id`,`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `roster_players_org_idx` ON `roster_players` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `roster_players_team_idx` ON `roster_players` (`team_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fixtures_org_idx` ON `fixtures` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fixtures_team_idx` ON `fixtures` (`team_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fixtures_scheduled_idx` ON `fixtures` (`scheduled_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `fixtures_team_gameday_idx` ON `fixtures` (`team_id`,`gameday_fixture_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `match_reports_org_idx` ON `match_reports` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `match_reports_team_idx` ON `match_reports` (`team_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `match_reports_fixture_idx` ON `match_reports` (`fixture_id`);
