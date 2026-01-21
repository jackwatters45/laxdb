CREATE TABLE "pipeline_standing" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"division" varchar(100),
	"conference" varchar(100),
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"ties" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"goals_for" integer DEFAULT 0 NOT NULL,
	"goals_against" integer DEFAULT 0 NOT NULL,
	"goal_diff" integer DEFAULT 0 NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"source_hash" varchar(64),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "uq_pipeline_standing_season_team" UNIQUE("season_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "pipeline_standing" ADD CONSTRAINT "pipeline_standing_season_id_pipeline_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pipeline_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_standing" ADD CONSTRAINT "pipeline_standing_team_id_pipeline_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."pipeline_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_standing_season" ON "pipeline_standing" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_standing_team" ON "pipeline_standing" USING btree ("team_id");