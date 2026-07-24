CREATE TABLE `gameday_ladder_rows` (
	`id` text PRIMARY KEY,
	`source_id` text NOT NULL,
	`season_id` text NOT NULL,
	`comp_id` text NOT NULL,
	`position` integer NOT NULL,
	`gameday_team_id` text,
	`team_name` text NOT NULL,
	`played` integer NOT NULL,
	`wins` integer NOT NULL,
	`losses` integer NOT NULL,
	`draws` integer NOT NULL,
	`byes` integer NOT NULL,
	`forfeits_for` integer NOT NULL,
	`forfeits_given` integer NOT NULL,
	`goals_for` integer NOT NULL,
	`goals_against` integer NOT NULL,
	`goal_difference` integer NOT NULL,
	`percentage` real NOT NULL,
	`premiership_points` integer NOT NULL,
	`source_uploaded_at` text,
	`fetched_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_gameday_ladder_rows_source_id_gameday_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `gameday_sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `fixture_player_stats` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`fixture_id` text NOT NULL,
	`team_id` text NOT NULL,
	`roster_player_id` text NOT NULL,
	`goals` integer DEFAULT 0 NOT NULL,
	`assists` integer DEFAULT 0 NOT NULL,
	`shots` integer,
	`saves` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_fixture_player_stats_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fixture_player_stats_fixture_id_fixtures_id_fk` FOREIGN KEY (`fixture_id`) REFERENCES `fixtures`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fixture_player_stats_team_id_club_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `club_teams`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fixture_player_stats_roster_player_id_roster_players_id_fk` FOREIGN KEY (`roster_player_id`) REFERENCES `roster_players`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `fixture_team_stats` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`fixture_id` text NOT NULL,
	`team_id` text NOT NULL,
	`goals_for_override` integer,
	`goals_against_override` integer,
	`assisted_goals` integer DEFAULT 0 NOT NULL,
	`shots` integer,
	`saves` integer,
	`submitted_by_user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_fixture_team_stats_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fixture_team_stats_fixture_id_fixtures_id_fk` FOREIGN KEY (`fixture_id`) REFERENCES `fixtures`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fixture_team_stats_team_id_club_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `club_teams`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_fixture_team_stats_submitted_by_user_id_user_id_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
ALTER TABLE `fixtures` ADD `source_id` text;--> statement-breakpoint
ALTER TABLE `fixtures` ADD `season_id` text;--> statement-breakpoint
UPDATE `fixtures`
SET
	`source_id` = (
		SELECT `source_id`
		FROM `club_team_gameday_links`
		WHERE `club_team_id` = `fixtures`.`team_id`
			AND `organization_id` = `fixtures`.`organization_id`
			AND `comp_id` = `fixtures`.`comp_id`
			AND `season_id` <> 'legacy'
		ORDER BY `created_at` DESC
		LIMIT 1
	),
	`season_id` = (
		SELECT `season_id`
		FROM `club_team_gameday_links`
		WHERE `club_team_id` = `fixtures`.`team_id`
			AND `organization_id` = `fixtures`.`organization_id`
			AND `comp_id` = `fixtures`.`comp_id`
			AND `season_id` <> 'legacy'
		ORDER BY `created_at` DESC
		LIMIT 1
	)
WHERE EXISTS (
	SELECT 1
	FROM `club_team_gameday_links`
	WHERE `club_team_id` = `fixtures`.`team_id`
		AND `organization_id` = `fixtures`.`organization_id`
		AND `comp_id` = `fixtures`.`comp_id`
		AND `season_id` <> 'legacy'
);--> statement-breakpoint
CREATE INDEX `gameday_ladder_rows_scope_idx` ON `gameday_ladder_rows` (`source_id`,`season_id`,`comp_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gameday_ladder_rows_team_idx` ON `gameday_ladder_rows` (`source_id`,`season_id`,`comp_id`,`team_name`);--> statement-breakpoint
CREATE INDEX `fixtures_team_season_idx` ON `fixtures` (`team_id`,`season_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `fixture_player_stats_player_idx` ON `fixture_player_stats` (`organization_id`,`fixture_id`,`roster_player_id`);--> statement-breakpoint
CREATE INDEX `fixture_player_stats_team_player_idx` ON `fixture_player_stats` (`organization_id`,`team_id`,`roster_player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `fixture_team_stats_fixture_idx` ON `fixture_team_stats` (`organization_id`,`fixture_id`);--> statement-breakpoint
CREATE INDEX `fixture_team_stats_team_idx` ON `fixture_team_stats` (`organization_id`,`team_id`);