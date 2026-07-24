INSERT OR IGNORE INTO `gameday_sources` (`id`, `name`, `client_id`, `base_url`)
VALUES ('lacrosse-victoria', 'Lacrosse Victoria', '0-1064-0-0-0', 'https://websites.mygameday.app');--> statement-breakpoint
INSERT OR IGNORE INTO `club_team_gameday_links` (
  `id`, `organization_id`, `club_team_id`, `source_id`, `season_id`, `comp_id`, `gameday_team_id`
)
SELECT
  'legacy-' || `id`,
  `organization_id`,
  `id`,
  'lacrosse-victoria',
  'legacy',
  `gameday_comp_id`,
  `gameday_team_id`
FROM `club_teams`
WHERE `gameday_comp_id` IS NOT NULL
  AND `gameday_team_id` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `club_teams` DROP COLUMN `gameday_comp_id`;--> statement-breakpoint
ALTER TABLE `club_teams` DROP COLUMN `gameday_team_id`;
