CREATE TABLE "pipeline_canonical_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"primary_source_player_id" integer NOT NULL,
	"display_name" varchar(200) NOT NULL,
	"position" varchar(50),
	"dob" timestamp (3),
	"hometown" varchar(200),
	"college" varchar(200),
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "pipeline_canonical_player" ADD CONSTRAINT "pipeline_canonical_player_primary_source_player_id_pipeline_source_player_id_fk" FOREIGN KEY ("primary_source_player_id") REFERENCES "public"."pipeline_source_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipeline_canonical_player_primary_source" ON "pipeline_canonical_player" USING btree ("primary_source_player_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_canonical_player_display_name" ON "pipeline_canonical_player" USING btree ("display_name");