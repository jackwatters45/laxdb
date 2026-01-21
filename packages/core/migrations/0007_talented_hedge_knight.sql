CREATE TABLE "pipeline_player_identity" (
	"id" serial PRIMARY KEY NOT NULL,
	"canonical_player_id" integer NOT NULL,
	"source_player_id" integer NOT NULL,
	"confidence_score" real DEFAULT 1 NOT NULL,
	"match_method" varchar(20) DEFAULT 'exact' NOT NULL,
	"created_at" timestamp (3) NOT NULL,
	CONSTRAINT "uniq_pipeline_player_identity_source" UNIQUE("source_player_id")
);
--> statement-breakpoint
ALTER TABLE "pipeline_player_identity" ADD CONSTRAINT "pipeline_player_identity_canonical_player_id_pipeline_canonical_player_id_fk" FOREIGN KEY ("canonical_player_id") REFERENCES "public"."pipeline_canonical_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_player_identity" ADD CONSTRAINT "pipeline_player_identity_source_player_id_pipeline_source_player_id_fk" FOREIGN KEY ("source_player_id") REFERENCES "public"."pipeline_source_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_player_identity_canonical" ON "pipeline_player_identity" USING btree ("canonical_player_id");