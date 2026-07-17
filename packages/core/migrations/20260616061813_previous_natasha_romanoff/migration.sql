CREATE TABLE IF NOT EXISTS `club_team_gameday_links` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`club_team_id` text NOT NULL,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`comp_id` text NOT NULL,
	`gameday_team_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_club_team_gameday_links_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_team_gameday_links_club_team_id_club_teams_id_fk` FOREIGN KEY (`club_team_id`) REFERENCES `club_teams`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_team_gameday_links_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gameday_competitions` (
	`id` text PRIMARY KEY,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`comp_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_gameday_competitions_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gameday_fixtures` (
	`id` text PRIMARY KEY,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`comp_id` text NOT NULL,
	`fixture_id` text NOT NULL,
	`comp_name` text,
	`round` text,
	`scheduled_at` integer,
	`home_team_id` text,
	`away_team_id` text,
	`home_team_name` text NOT NULL,
	`away_team_name` text NOT NULL,
	`venue_name` text,
	`match_status` text,
	`home_score` integer,
	`away_score` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_gameday_fixtures_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gameday_players` (
	`id` text PRIMARY KEY,
	`source_id` text NOT NULL,
	`player_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_gameday_players_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gameday_roster_entries` (
	`id` text PRIMARY KEY,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`comp_id` text NOT NULL,
	`team_id` text NOT NULL,
	`player_id` text NOT NULL,
	`player_name` text NOT NULL,
	`games_played` integer,
	`total_assists` integer,
	`total_score` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_gameday_roster_entries_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gameday_seasons` (
	`id` text PRIMARY KEY,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_gameday_seasons_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gameday_sources` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`client_id` text NOT NULL,
	`base_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gameday_teams` (
	`id` text PRIMARY KEY,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`comp_id` text NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_gameday_teams_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `roster_player_gameday_links` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`roster_player_id` text NOT NULL,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`comp_id` text NOT NULL,
	`gameday_team_id` text NOT NULL,
	`gameday_player_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_roster_player_gameday_links_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_roster_player_gameday_links_roster_player_id_roster_players_id_fk` FOREIGN KEY (`roster_player_id`) REFERENCES `roster_players`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_roster_player_gameday_links_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `match_images` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`fixture_id` text NOT NULL,
	`uploaded_by_user_id` text,
	`object_key` text NOT NULL UNIQUE,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_match_images_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_match_images_fixture_id_fixtures_id_fk` FOREIGN KEY (`fixture_id`) REFERENCES `fixtures`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_match_images_uploaded_by_user_id_user_id_fk` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `club_team_gameday_links_org_idx` ON `club_team_gameday_links` (`organization_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `club_team_gameday_links_club_team_idx` ON `club_team_gameday_links` (`club_team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `club_team_gameday_links_external_idx` ON `club_team_gameday_links` (`organization_id`,`source_id`,`season_id`,`comp_id`,`gameday_team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `club_team_gameday_links_club_external_idx` ON `club_team_gameday_links` (`club_team_id`,`source_id`,`season_id`,`comp_id`,`gameday_team_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_competitions_source_season_idx` ON `gameday_competitions` (`source_id`,`season_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `gameday_competitions_external_idx` ON `gameday_competitions` (`source_id`,`season_id`,`comp_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_fixtures_source_season_idx` ON `gameday_fixtures` (`source_id`,`season_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_fixtures_comp_idx` ON `gameday_fixtures` (`comp_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_fixtures_scheduled_idx` ON `gameday_fixtures` (`scheduled_at`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `gameday_fixtures_external_idx` ON `gameday_fixtures` (`source_id`,`season_id`,`comp_id`,`fixture_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_players_source_idx` ON `gameday_players` (`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `gameday_players_external_idx` ON `gameday_players` (`source_id`,`player_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_roster_entries_team_idx` ON `gameday_roster_entries` (`source_id`,`season_id`,`comp_id`,`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `gameday_roster_entries_external_idx` ON `gameday_roster_entries` (`source_id`,`season_id`,`comp_id`,`team_id`,`player_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_seasons_source_idx` ON `gameday_seasons` (`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `gameday_seasons_source_season_idx` ON `gameday_seasons` (`source_id`,`season_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_teams_source_season_idx` ON `gameday_teams` (`source_id`,`season_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gameday_teams_name_idx` ON `gameday_teams` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `gameday_teams_external_idx` ON `gameday_teams` (`source_id`,`season_id`,`comp_id`,`team_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `roster_player_gameday_links_org_idx` ON `roster_player_gameday_links` (`organization_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `roster_player_gameday_links_player_idx` ON `roster_player_gameday_links` (`roster_player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `roster_player_gameday_links_external_idx` ON `roster_player_gameday_links` (`organization_id`,`source_id`,`season_id`,`comp_id`,`gameday_team_id`,`gameday_player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `roster_player_gameday_links_player_external_idx` ON `roster_player_gameday_links` (`roster_player_id`,`source_id`,`season_id`,`comp_id`,`gameday_team_id`,`gameday_player_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `match_images_org_idx` ON `match_images` (`organization_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `match_images_fixture_idx` ON `match_images` (`fixture_id`);