CREATE TABLE "pipeline_source_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"source_id" varchar(50) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"full_name" varchar(200),
	"normalized_name" varchar(200),
	"position" varchar(50),
	"jersey_number" varchar(10),
	"dob" timestamp (3),
	"hometown" varchar(200),
	"college" varchar(200),
	"handedness" varchar(10),
	"height_inches" integer,
	"weight_lbs" integer,
	"source_hash" varchar(64),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "uniq_pipeline_source_player_league_source" UNIQUE("league_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "pipeline_source_player" ADD CONSTRAINT "pipeline_source_player_league_id_pipeline_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pipeline_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_source_player_league_id" ON "pipeline_source_player" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_source_player_normalized_name" ON "pipeline_source_player" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "idx_pipeline_source_player_source_id" ON "pipeline_source_player" USING btree ("source_id");