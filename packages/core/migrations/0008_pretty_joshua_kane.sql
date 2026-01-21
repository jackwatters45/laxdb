CREATE TABLE "pipeline_game" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"game_date" date NOT NULL,
	"game_time" time,
	"venue" varchar(200),
	"home_score" integer,
	"away_score" integer,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"source_id" varchar(50),
	"source_hash" varchar(64),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "pipeline_player_stat" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_player_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"game_id" varchar(50),
	"stat_type" varchar(20) DEFAULT 'regular' NOT NULL,
	"goals" integer DEFAULT 0,
	"assists" integer DEFAULT 0,
	"points" integer DEFAULT 0,
	"shots" integer DEFAULT 0,
	"shots_on_goal" integer DEFAULT 0,
	"ground_balls" integer DEFAULT 0,
	"turnovers" integer DEFAULT 0,
	"caused_turnovers" integer DEFAULT 0,
	"faceoff_wins" integer DEFAULT 0,
	"faceoff_losses" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"goals_against" integer DEFAULT 0,
	"games_played" integer DEFAULT 0,
	"source_hash" varchar(64),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "uniq_pipeline_player_stat_player_season_game" UNIQUE("source_player_id","season_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "pipeline_game" ADD CONSTRAINT "pipeline_game_season_id_pipeline_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pipeline_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_game" ADD CONSTRAINT "pipeline_game_home_team_id_pipeline_team_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."pipeline_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_game" ADD CONSTRAINT "pipeline_game_away_team_id_pipeline_team_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."pipeline_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_player_stat" ADD CONSTRAINT "pipeline_player_stat_source_player_id_pipeline_source_player_id_fk" FOREIGN KEY ("source_player_id") REFERENCES "public"."pipeline_source_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_player_stat" ADD CONSTRAINT "pipeline_player_stat_season_id_pipeline_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pipeline_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_player_stat" ADD CONSTRAINT "pipeline_player_stat_team_id_pipeline_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."pipeline_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_season_date" ON "pipeline_game" USING btree ("season_id","game_date");--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_home_team" ON "pipeline_game" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_away_team" ON "pipeline_game" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_source" ON "pipeline_game" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_stat_player_season" ON "pipeline_player_stat" USING btree ("source_player_id","season_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_stat_team_game" ON "pipeline_player_stat" USING btree ("team_id","game_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_stat_season" ON "pipeline_player_stat" USING btree ("season_id");