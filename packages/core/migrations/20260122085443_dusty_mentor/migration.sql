CREATE TABLE "pipeline_canonical_player" (
	"id" serial PRIMARY KEY,
	"primary_source_player_id" integer NOT NULL,
	"display_name" varchar(200) NOT NULL,
	"position" varchar(50),
	"dob" timestamp(3),
	"hometown" varchar(200),
	"college" varchar(200),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "pipeline_game" (
	"id" serial PRIMARY KEY,
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
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "pipeline_league" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"abbreviation" varchar(10) NOT NULL UNIQUE,
	"priority" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "pipeline_player_identity" (
	"id" serial PRIMARY KEY,
	"canonical_player_id" integer NOT NULL,
	"source_player_id" integer NOT NULL CONSTRAINT "uniq_pipeline_player_identity_source" UNIQUE,
	"confidence_score" real DEFAULT 1 NOT NULL,
	"match_method" varchar(20) DEFAULT 'exact' NOT NULL,
	"created_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_player_stat" (
	"id" serial PRIMARY KEY,
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
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3),
	CONSTRAINT "uniq_pipeline_player_stat_player_season_game" UNIQUE("source_player_id","season_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_scrape_run" (
	"id" serial PRIMARY KEY,
	"league_id" integer NOT NULL,
	"season_id" integer,
	"entity_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"started_at" timestamp(3) NOT NULL,
	"completed_at" timestamp(3),
	"records_processed" integer,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "pipeline_season" (
	"id" serial PRIMARY KEY,
	"league_id" integer NOT NULL,
	"year" integer NOT NULL,
	"name" varchar(100),
	"source_season_id" varchar(50),
	"start_date" date,
	"end_date" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3),
	CONSTRAINT "uq_pipeline_season_league_year" UNIQUE("league_id","year")
);
--> statement-breakpoint
CREATE TABLE "pipeline_source_player" (
	"id" serial PRIMARY KEY,
	"league_id" integer NOT NULL,
	"source_id" varchar(50) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"full_name" varchar(200),
	"normalized_name" varchar(200),
	"position" varchar(50),
	"jersey_number" varchar(10),
	"dob" timestamp(3),
	"hometown" varchar(200),
	"college" varchar(200),
	"handedness" varchar(10),
	"height_inches" integer,
	"weight_lbs" integer,
	"source_hash" varchar(64),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3),
	"deleted_at" timestamp(3),
	CONSTRAINT "uniq_pipeline_source_player_league_source" UNIQUE("league_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_standing" (
	"id" serial PRIMARY KEY,
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
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3),
	CONSTRAINT "uq_pipeline_standing_season_team" UNIQUE("season_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_team_season" (
	"id" serial PRIMARY KEY,
	"team_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"division" varchar(100),
	"conference" varchar(100),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3),
	CONSTRAINT "uq_pipeline_team_season" UNIQUE("team_id","season_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_team" (
	"id" serial PRIMARY KEY,
	"league_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"abbreviation" varchar(10),
	"city" varchar(100),
	"source_id" varchar(50),
	"source_hash" varchar(64),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3)
);
--> statement-breakpoint
CREATE INDEX "idx_pipeline_canonical_player_primary_source" ON "pipeline_canonical_player" ("primary_source_player_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_canonical_player_display_name" ON "pipeline_canonical_player" ("display_name");--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_season_date" ON "pipeline_game" ("season_id","game_date");--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_home_team" ON "pipeline_game" ("home_team_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_away_team" ON "pipeline_game" ("away_team_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_game_source" ON "pipeline_game" ("source_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_league_abbreviation" ON "pipeline_league" ("abbreviation");--> statement-breakpoint
CREATE INDEX "idx_pipeline_league_priority" ON "pipeline_league" ("priority");--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_identity_canonical" ON "pipeline_player_identity" ("canonical_player_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_stat_player_season" ON "pipeline_player_stat" ("source_player_id","season_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_stat_team_game" ON "pipeline_player_stat" ("team_id","game_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_stat_season" ON "pipeline_player_stat" ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_scrape_run_league_entity_started" ON "pipeline_scrape_run" ("league_id","entity_type","started_at");--> statement-breakpoint
CREATE INDEX "idx_pipeline_scrape_run_status" ON "pipeline_scrape_run" ("status");--> statement-breakpoint
CREATE INDEX "idx_pipeline_season_league_id" ON "pipeline_season" ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_season_year" ON "pipeline_season" ("year");--> statement-breakpoint
CREATE INDEX "idx_pipeline_season_source_id" ON "pipeline_season" ("source_season_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_source_player_league_id" ON "pipeline_source_player" ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_source_player_normalized_name" ON "pipeline_source_player" ("normalized_name");--> statement-breakpoint
CREATE INDEX "idx_pipeline_source_player_source_id" ON "pipeline_source_player" ("source_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_standing_season" ON "pipeline_standing" ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_standing_team" ON "pipeline_standing" ("team_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_season_team_id" ON "pipeline_team_season" ("team_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_season_season_id" ON "pipeline_team_season" ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_league_id" ON "pipeline_team" ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_league_source" ON "pipeline_team" ("league_id","source_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_team_name" ON "pipeline_team" ("name");--> statement-breakpoint
ALTER TABLE "pipeline_canonical_player" ADD CONSTRAINT "pipeline_canonical_player_P2gRXTT7V8WL_fkey" FOREIGN KEY ("primary_source_player_id") REFERENCES "pipeline_source_player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_game" ADD CONSTRAINT "pipeline_game_season_id_pipeline_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "pipeline_season"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_game" ADD CONSTRAINT "pipeline_game_home_team_id_pipeline_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "pipeline_team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_game" ADD CONSTRAINT "pipeline_game_away_team_id_pipeline_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "pipeline_team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_player_identity" ADD CONSTRAINT "pipeline_player_identity_GhiAZ2zDcp1u_fkey" FOREIGN KEY ("canonical_player_id") REFERENCES "pipeline_canonical_player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_player_identity" ADD CONSTRAINT "pipeline_player_identity_6JKTdjrwM9Ca_fkey" FOREIGN KEY ("source_player_id") REFERENCES "pipeline_source_player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_player_stat" ADD CONSTRAINT "pipeline_player_stat_ubmzjW8rXVhi_fkey" FOREIGN KEY ("source_player_id") REFERENCES "pipeline_source_player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_player_stat" ADD CONSTRAINT "pipeline_player_stat_season_id_pipeline_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "pipeline_season"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_player_stat" ADD CONSTRAINT "pipeline_player_stat_team_id_pipeline_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "pipeline_team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_scrape_run" ADD CONSTRAINT "pipeline_scrape_run_league_id_pipeline_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "pipeline_league"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_scrape_run" ADD CONSTRAINT "pipeline_scrape_run_season_id_pipeline_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "pipeline_season"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_season" ADD CONSTRAINT "pipeline_season_league_id_pipeline_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "pipeline_league"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_source_player" ADD CONSTRAINT "pipeline_source_player_league_id_pipeline_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "pipeline_league"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_standing" ADD CONSTRAINT "pipeline_standing_season_id_pipeline_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "pipeline_season"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_standing" ADD CONSTRAINT "pipeline_standing_team_id_pipeline_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "pipeline_team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_team_season" ADD CONSTRAINT "pipeline_team_season_team_id_pipeline_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "pipeline_team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_team_season" ADD CONSTRAINT "pipeline_team_season_season_id_pipeline_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "pipeline_season"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pipeline_team" ADD CONSTRAINT "pipeline_team_league_id_pipeline_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "pipeline_league"("id") ON DELETE CASCADE;