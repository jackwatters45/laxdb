CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`inviter_id` text NOT NULL,
	CONSTRAINT `fk_invitation_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invitation_inviter_id_user_id_fk` FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_member_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_member_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text UNIQUE,
	`logo` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `club_teams` (
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
CREATE TABLE `report_recipients` (
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
CREATE TABLE `roster_players` (
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
CREATE TABLE `defaults` (
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
CREATE TABLE `drill` (
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
CREATE TABLE `fine_events` (
	`id` text PRIMARY KEY,
	`fine_id` text NOT NULL,
	`kind` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`delta_cents` integer DEFAULT 0 NOT NULL,
	`actor_user_id` text,
	`note` text,
	`at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_fine_events_fine_id_fines_id_fk` FOREIGN KEY (`fine_id`) REFERENCES `fines`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fine_events_actor_user_id_user_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `fine_templates` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`label` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_fine_templates_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `fines` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`member_id` text NOT NULL,
	`template_id` text,
	`reason` text NOT NULL,
	`original_amount_cents` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`issued_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`due_at` integer NOT NULL,
	`paid_at` integer,
	`issued_by_user_id` text,
	CONSTRAINT `fk_fines_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fines_member_id_member_id_fk` FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fines_template_id_fine_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `fine_templates`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_fines_issued_by_user_id_user_id_fk` FOREIGN KEY (`issued_by_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `fixtures` (
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
CREATE TABLE `match_reports` (
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
CREATE TABLE `play` (
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
CREATE TABLE `player` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`public_id` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `practice_edge` (
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
CREATE TABLE `practice_item` (
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
CREATE TABLE `practice_review` (
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
CREATE TABLE `practice` (
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
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `invitation_org_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE INDEX `member_org_idx` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_user_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `club_teams_org_idx` ON `club_teams` (`organization_id`);--> statement-breakpoint
CREATE INDEX `club_teams_coach_idx` ON `club_teams` (`coach_member_id`);--> statement-breakpoint
CREATE INDEX `report_recipients_org_idx` ON `report_recipients` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `report_recipients_org_team_email_idx` ON `report_recipients` (`organization_id`,`team_id`,`email`);--> statement-breakpoint
CREATE INDEX `roster_players_org_idx` ON `roster_players` (`organization_id`);--> statement-breakpoint
CREATE INDEX `roster_players_team_idx` ON `roster_players` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_defaults_scope` ON `defaults` (`scope_type`,`scope_id`);--> statement-breakpoint
CREATE INDEX `idx_defaults_namespace` ON `defaults` (`namespace`);--> statement-breakpoint
CREATE INDEX `idx_drill_difficulty` ON `drill` (`difficulty`);--> statement-breakpoint
CREATE INDEX `idx_drill_name` ON `drill` (`name`);--> statement-breakpoint
CREATE INDEX `fine_events_fine_idx` ON `fine_events` (`fine_id`);--> statement-breakpoint
CREATE INDEX `fine_events_at_idx` ON `fine_events` (`at`);--> statement-breakpoint
CREATE INDEX `fine_templates_org_idx` ON `fine_templates` (`organization_id`);--> statement-breakpoint
CREATE INDEX `fines_org_idx` ON `fines` (`organization_id`);--> statement-breakpoint
CREATE INDEX `fines_member_idx` ON `fines` (`member_id`);--> statement-breakpoint
CREATE INDEX `fines_status_due_idx` ON `fines` (`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `fixtures_org_idx` ON `fixtures` (`organization_id`);--> statement-breakpoint
CREATE INDEX `fixtures_team_idx` ON `fixtures` (`team_id`);--> statement-breakpoint
CREATE INDEX `fixtures_scheduled_idx` ON `fixtures` (`scheduled_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `fixtures_team_gameday_idx` ON `fixtures` (`team_id`,`gameday_fixture_id`);--> statement-breakpoint
CREATE INDEX `match_reports_org_idx` ON `match_reports` (`organization_id`);--> statement-breakpoint
CREATE INDEX `match_reports_team_idx` ON `match_reports` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `match_reports_fixture_idx` ON `match_reports` (`fixture_id`);--> statement-breakpoint
CREATE INDEX `idx_play_category` ON `play` (`category`);--> statement-breakpoint
CREATE INDEX `idx_play_name` ON `play` (`name`);--> statement-breakpoint
CREATE INDEX `idx_player_name` ON `player` (`name`);--> statement-breakpoint
CREATE INDEX `idx_player_email` ON `player` (`email`);--> statement-breakpoint
CREATE INDEX `idx_practice_edge_practice` ON `practice_edge` (`practice_public_id`);--> statement-breakpoint
CREATE INDEX `idx_practice_edge_source` ON `practice_edge` (`source_public_id`);--> statement-breakpoint
CREATE INDEX `idx_practice_edge_target` ON `practice_edge` (`target_public_id`);--> statement-breakpoint
CREATE INDEX `idx_practice_item_practice` ON `practice_item` (`practice_public_id`);--> statement-breakpoint
CREATE INDEX `idx_practice_item_order` ON `practice_item` (`practice_public_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `idx_practice_item_drill` ON `practice_item` (`drill_public_id`);--> statement-breakpoint
CREATE INDEX `idx_practice_status` ON `practice` (`status`);--> statement-breakpoint
CREATE INDEX `idx_practice_date` ON `practice` (`date`);