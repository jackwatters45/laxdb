CREATE TABLE "pipeline_league" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"abbreviation" varchar(10) NOT NULL,
	"priority" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "pipeline_league_abbreviation_unique" UNIQUE("abbreviation")
);
--> statement-breakpoint
CREATE INDEX "idx_pipeline_league_abbreviation" ON "pipeline_league" USING btree ("abbreviation");--> statement-breakpoint
CREATE INDEX "idx_pipeline_league_priority" ON "pipeline_league" USING btree ("priority");