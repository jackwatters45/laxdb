CREATE TYPE "public"."status" AS ENUM('active', 'completed', 'upcoming');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp (3),
	"refresh_token_expires_at" timestamp (3),
	"scope" text,
	"password" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3) NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"active_team_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"created_at" timestamp (3),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"topic" text NOT NULL,
	"rating" text NOT NULL,
	"feedback" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "feedback_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "game" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"organization_id" text NOT NULL,
	"team_id" text NOT NULL,
	"seasonId" integer NOT NULL,
	"opponent_name" text NOT NULL,
	"opponent_team_id" text,
	"game_date" timestamp (3) NOT NULL,
	"venue" text NOT NULL,
	"is_home_game" boolean NOT NULL,
	"game_type" text DEFAULT 'regular' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"home_score" integer DEFAULT 0,
	"away_score" integer DEFAULT 0,
	"notes" text,
	"location" text,
	"uniform_color" text,
	"arrival_time" timestamp (3),
	"opponent_logo_url" text,
	"external_game_id" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "game_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"team_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp (3) NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "player_contact_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"player_id" integer NOT NULL,
	"email" text,
	"phone" text,
	"facebook" text,
	"instagram" text,
	"whatsapp" text,
	"linkedin" text,
	"groupme" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "player_contact_info_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "player_contact_info_player_id_unique" UNIQUE("player_id")
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"name" text,
	"email" text,
	"phone" text,
	"date_of_birth" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "player_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "team_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"team_id" text NOT NULL,
	"player_id" integer NOT NULL,
	"jersey_number" integer,
	"position" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "team_player_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "pro_data_ingestion" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"league_id" integer NOT NULL,
	"season_id" integer,
	"entity_type" varchar(50) NOT NULL,
	"source_url" text,
	"source_type" varchar(20),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp (3),
	"completed_at" timestamp (3),
	"records_processed" integer DEFAULT 0,
	"records_created" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_skipped" integer DEFAULT 0,
	"duration_ms" integer,
	"error_message" text,
	"error_stack" text,
	"raw_data_url" text,
	"manifest_version" integer,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_data_ingestion_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "pro_game" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"season_id" integer NOT NULL,
	"external_id" text,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"game_date" timestamp (3) NOT NULL,
	"week" varchar(20),
	"game_number" integer,
	"venue" text,
	"venue_city" text,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"is_overtime" boolean DEFAULT false,
	"overtime_periods" integer DEFAULT 0,
	"play_by_play_url" text,
	"home_team_stats" jsonb,
	"away_team_stats" jsonb,
	"broadcaster" text,
	"stream_url" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_game_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pro_game_season_external" UNIQUE("season_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "pro_league" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"country" varchar(2),
	"is_active" boolean DEFAULT true NOT NULL,
	"founded_year" integer,
	"defunct_year" integer,
	"website_url" text,
	"logo_url" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_league_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pro_league_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pro_player_season" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"player_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"team_id" integer,
	"jersey_number" integer,
	"position" varchar(20),
	"is_captain" boolean DEFAULT false,
	"stats" jsonb,
	"post_season_stats" jsonb,
	"goalie_stats" jsonb,
	"post_season_goalie_stats" jsonb,
	"games_played" integer DEFAULT 0,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_player_season_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pro_player_season_unique" UNIQUE("player_id","season_id")
);
--> statement-breakpoint
CREATE TABLE "pro_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"league_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"canonical_player_id" integer,
	"first_name" text,
	"last_name" text NOT NULL,
	"full_name" text,
	"position" varchar(20),
	"date_of_birth" date,
	"birthplace" text,
	"country" varchar(2),
	"height" varchar(10),
	"weight" integer,
	"handedness" varchar(5),
	"college" text,
	"high_school" text,
	"profile_url" text,
	"photo_url" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_player_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pro_player_league_external" UNIQUE("league_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "pro_season" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"league_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"year" integer NOT NULL,
	"display_name" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_season_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pro_season_league_external" UNIQUE("league_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "pro_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"season_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"snapshot_date" date NOT NULL,
	"position" integer NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"ties" integer DEFAULT 0,
	"overtime_losses" integer DEFAULT 0,
	"points" integer,
	"win_percentage" integer,
	"goals_for" integer DEFAULT 0,
	"goals_against" integer DEFAULT 0,
	"goal_differential" integer DEFAULT 0,
	"conference" varchar(50),
	"division" varchar(50),
	"clinch_status" varchar(10),
	"seed" integer,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_standings_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pro_standings_season_team_date" UNIQUE("season_id","team_id","snapshot_date")
);
--> statement-breakpoint
CREATE TABLE "pro_team" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"league_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"code" varchar(10),
	"name" text NOT NULL,
	"short_name" text,
	"city" text,
	"logo_url" text,
	"primary_color" varchar(7),
	"secondary_color" varchar(7),
	"website_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"first_season_year" integer,
	"last_season_year" integer,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pro_team_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pro_team_league_external" UNIQUE("league_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "season" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"organization_id" text NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp (3) NOT NULL,
	"end_date" timestamp (3),
	"status" "status" DEFAULT 'active' NOT NULL,
	"division" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "season_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "team_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp (3),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_seasonId_season_id_fk" FOREIGN KEY ("seasonId") REFERENCES "public"."season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_contact_info" ADD CONSTRAINT "player_contact_info_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_data_ingestion" ADD CONSTRAINT "pro_data_ingestion_league_id_pro_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pro_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_data_ingestion" ADD CONSTRAINT "pro_data_ingestion_season_id_pro_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pro_season"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_game" ADD CONSTRAINT "pro_game_season_id_pro_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pro_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_game" ADD CONSTRAINT "pro_game_home_team_id_pro_team_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."pro_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_game" ADD CONSTRAINT "pro_game_away_team_id_pro_team_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."pro_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_player_season" ADD CONSTRAINT "pro_player_season_player_id_pro_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."pro_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_player_season" ADD CONSTRAINT "pro_player_season_season_id_pro_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pro_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_player_season" ADD CONSTRAINT "pro_player_season_team_id_pro_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."pro_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_player" ADD CONSTRAINT "pro_player_league_id_pro_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pro_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_player" ADD CONSTRAINT "pro_player_canonical_player_id_pro_player_id_fk" FOREIGN KEY ("canonical_player_id") REFERENCES "public"."pro_player"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_season" ADD CONSTRAINT "pro_season_league_id_pro_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pro_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_standings" ADD CONSTRAINT "pro_standings_season_id_pro_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."pro_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_standings" ADD CONSTRAINT "pro_standings_team_id_pro_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."pro_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_team" ADD CONSTRAINT "pro_team_league_id_pro_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."pro_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_game_organization" ON "game" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_game_team" ON "game" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_game_date" ON "game" USING btree ("game_date");--> statement-breakpoint
CREATE INDEX "idx_game_status" ON "game" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_game_team_date" ON "game" USING btree ("team_id","game_date");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organization_id_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_slug_idx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_player_contact_info_player" ON "player_contact_info" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_player_organization" ON "player" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_player_name" ON "player" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_player_email" ON "player" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_team_player_team" ON "team_player" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_player_player" ON "team_player" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_team_player_unique" ON "team_player" USING btree ("team_id","player_id");--> statement-breakpoint
CREATE INDEX "idx_pro_ingestion_league" ON "pro_data_ingestion" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pro_ingestion_season" ON "pro_data_ingestion" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pro_ingestion_entity" ON "pro_data_ingestion" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_pro_ingestion_status" ON "pro_data_ingestion" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pro_ingestion_created" ON "pro_data_ingestion" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pro_game_season" ON "pro_game" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pro_game_home_team" ON "pro_game" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "idx_pro_game_away_team" ON "pro_game" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "idx_pro_game_date" ON "pro_game" USING btree ("game_date");--> statement-breakpoint
CREATE INDEX "idx_pro_game_status" ON "pro_game" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pro_league_code" ON "pro_league" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_pro_league_active" ON "pro_league" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_pro_player_season_player" ON "pro_player_season" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_pro_player_season_season" ON "pro_player_season" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pro_player_season_team" ON "pro_player_season" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_pro_player_league" ON "pro_player" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pro_player_name" ON "pro_player" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "idx_pro_player_canonical" ON "pro_player" USING btree ("canonical_player_id");--> statement-breakpoint
CREATE INDEX "idx_pro_player_position" ON "pro_player" USING btree ("position");--> statement-breakpoint
CREATE INDEX "idx_pro_season_league" ON "pro_season" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pro_season_year" ON "pro_season" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_pro_season_current" ON "pro_season" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "idx_pro_standings_season" ON "pro_standings" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_pro_standings_team" ON "pro_standings" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_pro_standings_date" ON "pro_standings" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_pro_standings_position" ON "pro_standings" USING btree ("position");--> statement-breakpoint
CREATE INDEX "idx_pro_team_league" ON "pro_team" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_pro_team_code" ON "pro_team" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_pro_team_active" ON "pro_team" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_season_organization" ON "season" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_season_team" ON "season" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_member_team_id_idx" ON "team_member" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_member_user_id_idx" ON "team_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_member_team_user_idx" ON "team_member" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_organization_id_idx" ON "team" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_name_idx" ON "team" USING btree ("name");--> statement-breakpoint
CREATE INDEX "team_created_at_idx" ON "team" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "user" USING btree ("name");