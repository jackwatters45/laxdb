CREATE TABLE "pipeline_team" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"abbreviation" varchar(10),
	"city" varchar(100),
	"source_id" varchar(50),
	"source_hash" varchar(64),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "pipeline_team" ADD CONSTRAINT "pipeline_team_league_id_pipeline_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pipeline_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_league_id" ON "pipeline_team" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_league_source" ON "pipeline_team" USING btree ("league_id","source_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_name" ON "pipeline_team" USING btree ("name");