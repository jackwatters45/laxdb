CREATE TABLE "drill" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"name" text NOT NULL,
	"subtitle" text,
	"description" text,
	"difficulty" text DEFAULT 'intermediate' NOT NULL,
	"category" text[] DEFAULT '{}'::text[] NOT NULL,
	"position_group" text[] DEFAULT '{}'::text[] NOT NULL,
	"intensity" text,
	"contact" boolean,
	"competitive" boolean,
	"player_count" integer,
	"duration_minutes" integer,
	"field_space" text,
	"equipment" text[],
	"diagram_url" text,
	"video_url" text,
	"coach_notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"name" text,
	"email" text,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp(3),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE INDEX "idx_drill_difficulty" ON "drill" ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_drill_name" ON "drill" ("name");--> statement-breakpoint
CREATE INDEX "idx_player_name" ON "player" ("name");--> statement-breakpoint
CREATE INDEX "idx_player_email" ON "player" ("email");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" ("email");--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "user" ("name");