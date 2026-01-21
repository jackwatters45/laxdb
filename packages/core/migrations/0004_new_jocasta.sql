CREATE TABLE "pipeline_team_season" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"division" varchar(100),
	"conference" varchar(100),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "uq_pipeline_team_season" UNIQUE("team_id","season_id")
);
--> statement-breakpoint
ALTER TABLE "pipeline_team_season" ADD CONSTRAINT "pipeline_team_season_team_id_pipeline_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."pipeline_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_team_season" ADD CONSTRAINT "pipeline_team_season_season_id_pipeline_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pipeline_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_season_team_id" ON "pipeline_team_season" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_season_season_id" ON "pipeline_team_season" USING btree ("season_id");