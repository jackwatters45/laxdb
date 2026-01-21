CREATE TABLE "pipeline_scrape_run" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"season_id" integer,
	"entity_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"started_at" timestamp (3) NOT NULL,
	"completed_at" timestamp (3),
	"records_processed" integer,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "pipeline_scrape_run" ADD CONSTRAINT "pipeline_scrape_run_league_id_pipeline_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pipeline_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_scrape_run" ADD CONSTRAINT "pipeline_scrape_run_season_id_pipeline_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pipeline_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_scrape_run_league_entity_started" ON "pipeline_scrape_run" USING btree ("league_id","entity_type","started_at");--> statement-breakpoint
CREATE INDEX "idx_pipeline_scrape_run_status" ON "pipeline_scrape_run" USING btree ("status");