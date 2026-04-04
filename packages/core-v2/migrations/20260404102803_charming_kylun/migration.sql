CREATE TABLE "play" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"formation" text,
	"description" text,
	"personnel_notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"diagram_url" text,
	"video_url" text,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "practice_edge" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"practice_public_id" text NOT NULL,
	"source_public_id" text NOT NULL,
	"target_public_id" text NOT NULL,
	"label" text,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE INDEX "idx_play_category" ON "play" ("category");--> statement-breakpoint
CREATE INDEX "idx_play_name" ON "play" ("name");--> statement-breakpoint
CREATE INDEX "idx_practice_edge_practice" ON "practice_edge" ("practice_public_id");--> statement-breakpoint
CREATE INDEX "idx_practice_edge_source" ON "practice_edge" ("source_public_id");--> statement-breakpoint
CREATE INDEX "idx_practice_edge_target" ON "practice_edge" ("target_public_id");