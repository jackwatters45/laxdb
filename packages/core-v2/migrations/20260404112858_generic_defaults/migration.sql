CREATE TABLE "defaults" (
	"id" serial PRIMARY KEY,
	"public_id" varchar(12) NOT NULL UNIQUE,
	"scope_type" text NOT NULL,
	"scope_id" text NOT NULL,
	"namespace" text NOT NULL,
	"values_json" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3),
	CONSTRAINT "uq_defaults_scope_namespace" UNIQUE("scope_type","scope_id","namespace")
);
--> statement-breakpoint
CREATE INDEX "idx_defaults_scope" ON "defaults" ("scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "idx_defaults_namespace" ON "defaults" ("namespace");--> statement-breakpoint
INSERT INTO "defaults" (
	"public_id",
	"scope_type",
	"scope_id",
	"namespace",
	"values_json",
	"created_at",
	"updated_at"
)
SELECT
	"public_id",
	'global',
	'global',
	'practice',
	jsonb_strip_nulls(jsonb_build_object(
		'durationMinutes', "duration_minutes",
		'location', "location"
	)),
	"created_at",
	"updated_at"
FROM "practice_defaults"
ON CONFLICT ("scope_type", "scope_id", "namespace") DO NOTHING;