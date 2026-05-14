PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_organization` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text UNIQUE,
	`logo` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_organization`(`id`, `name`, `slug`, `logo`, `metadata`, `created_at`) SELECT `id`, `name`, `slug`, `logo`, `metadata`, `created_at` FROM `organization`;--> statement-breakpoint
DROP TABLE `organization`;--> statement-breakpoint
ALTER TABLE `__new_organization` RENAME TO `organization`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_session`(`id`, `expires_at`, `token`, `created_at`, `updated_at`, `ip_address`, `user_agent`, `user_id`, `active_organization_id`) SELECT `id`, `expires_at`, `token`, `created_at`, `updated_at`, `ip_address`, `user_agent`, `user_id`, `active_organization_id` FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`) SELECT `id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `organization_slug_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `session_token_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `user_email_unique`;--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);