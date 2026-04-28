import { Schema } from "effect";

import { NanoidSchema, PublicIdSchema, TimestampsSchema } from "../schema";

// ---------------------------------------------------------------------------
// Enums — enforced at the Effect layer, stored as text in SQLite for flexibility
// ---------------------------------------------------------------------------

export const PlayCategory = Schema.Literals([
  "offense",
  "defense",
  "clear",
  "ride",
  "faceoff",
  "emo",
  "man-down",
  "transition",
]);

// ---------------------------------------------------------------------------
// Domain schemas
// ---------------------------------------------------------------------------

export class Play extends Schema.Class<Play>("Play")({
  ...PublicIdSchema,
  name: Schema.String,
  category: PlayCategory,
  formation: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  personnelNotes: Schema.NullOr(Schema.String),
  tags: Schema.Array(Schema.String),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class CreatePlayInput extends Schema.Class<CreatePlayInput>(
  "CreatePlayInput",
)({
  name: Schema.String.check(Schema.isMinLength(1)),
  category: PlayCategory,
  formation: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  personnelNotes: Schema.NullOr(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
}) {}

export class GetPlayInput extends Schema.Class<GetPlayInput>("GetPlayInput")({
  publicId: NanoidSchema,
}) {}

export class UpdatePlayInput extends Schema.Class<UpdatePlayInput>(
  "UpdatePlayInput",
)({
  publicId: NanoidSchema,
  name: Schema.optional(Schema.String.check(Schema.isMinLength(1))),
  category: Schema.optional(PlayCategory),
  formation: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  personnelNotes: Schema.optional(Schema.NullOr(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.String)),
  diagramUrl: Schema.optional(Schema.NullOr(Schema.String)),
  videoUrl: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class DeletePlayInput extends Schema.Class<DeletePlayInput>(
  "DeletePlayInput",
)({
  publicId: NanoidSchema,
}) {}
