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
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_defaults_scope` ON `defaults` (`scope_type`,`scope_id`);--> statement-breakpoint
CREATE INDEX `idx_defaults_namespace` ON `defaults` (`namespace`);--> statement-breakpoint
CREATE INDEX `idx_drill_difficulty` ON `drill` (`difficulty`);--> statement-breakpoint
CREATE INDEX `idx_drill_name` ON `drill` (`name`);--> statement-breakpoint
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
CREATE INDEX `idx_practice_date` ON `practice` (`date`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_name_idx` ON `user` (`name`);