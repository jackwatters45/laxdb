import { Schema } from "effect";

import { NanoidSchema, TimestampsSchema } from "../schema";

// ---------------------------------------------------------------------------
// Domain schema
// ---------------------------------------------------------------------------

export class PracticeDefaultsSchema extends Schema.Class<PracticeDefaultsSchema>(
  "PracticeDefaults",
)({
  publicId: NanoidSchema,
  durationMinutes: Schema.NullOr(Schema.Number),
  location: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export class UpsertPracticeDefaultsInput extends Schema.Class<UpsertPracticeDefaultsInput>(
  "UpsertPracticeDefaultsInput",
)({
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  location: Schema.optional(Schema.NullOr(Schema.String)),
}) {}
