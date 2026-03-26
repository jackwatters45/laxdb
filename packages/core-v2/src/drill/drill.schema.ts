import { Schema } from "effect";

import { NanoidSchema, PublicIdSchema, TimestampsSchema } from "../schema";

// ---------------------------------------------------------------------------
// Enums — enforced at the Effect layer, stored as text in PG for flexibility
// ---------------------------------------------------------------------------

export const Difficulty = Schema.Literals([
  "beginner",
  "intermediate",
  "advanced",
]);

export const Category = Schema.Literals([
  "passing",
  "shooting",
  "defense",
  "ground-balls",
  "face-offs",
  "clearing",
  "riding",
  "transition",
  "man-up",
  "man-down",
  "conditioning",
]);

export const PositionGroup = Schema.Literals([
  "attack",
  "midfield",
  "defense",
  "goalie",
  "all",
]);

export const Intensity = Schema.Literals(["low", "medium", "high"]);

export const FieldSpace = Schema.Literals(["full-field", "half-field", "box"]);

// ---------------------------------------------------------------------------
// Domain schemas
// ---------------------------------------------------------------------------

export class Drill extends Schema.Class<Drill>("Drill")({
  ...PublicIdSchema,
  name: Schema.String,
  subtitle: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  difficulty: Difficulty,
  category: Schema.Array(Category),
  positionGroup: Schema.Array(PositionGroup),
  intensity: Schema.NullOr(Intensity),
  contact: Schema.NullOr(Schema.Boolean),
  competitive: Schema.NullOr(Schema.Boolean),
  playerCount: Schema.NullOr(Schema.Number),
  durationMinutes: Schema.NullOr(Schema.Number),
  fieldSpace: Schema.NullOr(FieldSpace),
  equipment: Schema.NullOr(Schema.Array(Schema.String)),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
  coachNotes: Schema.NullOr(Schema.String),
  tags: Schema.Array(Schema.String),
  ...TimestampsSchema,
}) {}

export class CreateDrillInput extends Schema.Class<CreateDrillInput>(
  "CreateDrillInput",
)({
  name: Schema.String.check(Schema.isMinLength(1)),
  subtitle: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  difficulty: Schema.optional(Difficulty),
  category: Schema.optional(Schema.Array(Category)),
  positionGroup: Schema.optional(Schema.Array(PositionGroup)),
  intensity: Schema.NullOr(Intensity),
  contact: Schema.NullOr(Schema.Boolean),
  competitive: Schema.NullOr(Schema.Boolean),
  playerCount: Schema.NullOr(Schema.Number),
  durationMinutes: Schema.NullOr(Schema.Number),
  fieldSpace: Schema.NullOr(FieldSpace),
  equipment: Schema.NullOr(Schema.Array(Schema.String)),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
  coachNotes: Schema.NullOr(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
}) {}

export class GetDrillInput extends Schema.Class<GetDrillInput>("GetDrillInput")(
  {
    publicId: NanoidSchema,
  },
) {}

export class UpdateDrillInput extends Schema.Class<UpdateDrillInput>(
  "UpdateDrillInput",
)({
  publicId: NanoidSchema,
  name: Schema.optional(Schema.String.check(Schema.isMinLength(1))),
  subtitle: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  difficulty: Schema.optional(Difficulty),
  category: Schema.optional(Schema.Array(Category)),
  positionGroup: Schema.optional(Schema.Array(PositionGroup)),
  intensity: Schema.optional(Schema.NullOr(Intensity)),
  contact: Schema.optional(Schema.NullOr(Schema.Boolean)),
  competitive: Schema.optional(Schema.NullOr(Schema.Boolean)),
  playerCount: Schema.optional(Schema.NullOr(Schema.Number)),
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  fieldSpace: Schema.optional(Schema.NullOr(FieldSpace)),
  equipment: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  diagramUrl: Schema.optional(Schema.NullOr(Schema.String)),
  videoUrl: Schema.optional(Schema.NullOr(Schema.String)),
  coachNotes: Schema.optional(Schema.NullOr(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.String)),
}) {}

export class DeleteDrillInput extends Schema.Class<DeleteDrillInput>(
  "DeleteDrillInput",
)({
  publicId: NanoidSchema,
}) {}

/** Wrap a plain row as a Schema.Class instance */
export const asDrill = (row: typeof Drill.Type) => new Drill(row);
