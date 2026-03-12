CREATE TABLE "practice_item" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"practice_public_id" text NOT NULL,
	"type" text NOT NULL,
	"drill_public_id" text,
	"label" text,
	"duration_minutes" integer,
	"notes" text,
	"groups" text[] DEFAULT '{all}'::text[] NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"priority" text DEFAULT 'required' NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "practice_review" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"practice_public_id" text NOT NULL CONSTRAINT "uq_practice_review_practice" UNIQUE,
	"went_well" text,
	"needs_improvement" text,
	"notes" text,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "practice" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"name" text,
	"date" timestamp(3),
	"description" text,
	"notes" text,
	"duration_minutes" integer,
	"location" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE INDEX "idx_practice_item_practice" ON "practice_item" ("practice_public_id");--> statement-breakpoint
CREATE INDEX "idx_practice_item_order" ON "practice_item" ("practice_public_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_practice_item_drill" ON "practice_item" ("drill_public_id");--> statement-breakpoint
CREATE INDEX "idx_practice_status" ON "practice" ("status");--> statement-breakpoint
CREATE INDEX "idx_practice_date" ON "practice" ("date");