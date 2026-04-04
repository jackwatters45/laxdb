CREATE TABLE "practice_defaults" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"duration_minutes" integer,
	"location" text,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
ALTER TABLE "practice_item" ADD COLUMN "variant" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_item" ADD COLUMN "position_x" integer;--> statement-breakpoint
ALTER TABLE "practice_item" ADD COLUMN "position_y" integer;