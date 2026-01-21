CREATE TABLE "pipeline_season" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"year" integer NOT NULL,
	"name" varchar(100),
	"source_season_id" varchar(50),
	"start_date" date,
	"end_date" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "uq_pipeline_season_league_year" UNIQUE("league_id","year")
);
--> statement-breakpoint
ALTER TABLE "pipeline_season" ADD CONSTRAINT "pipeline_season_league_id_pipeline_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pipeline_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_season_league_id" ON "pipeline_season" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_season_year" ON "pipeline_season" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_pipeline_season_source_id" ON "pipeline_season" USING btree ("source_season_id");