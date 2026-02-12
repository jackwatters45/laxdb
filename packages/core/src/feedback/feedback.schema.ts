import { Schema } from "effect";

import { TimestampsSchema } from "../schema";

export const AttachmentSchema = Schema.Struct({
  key: Schema.String,
  name: Schema.String,
  size: Schema.Number,
  type: Schema.String,
});

export class Feedback extends Schema.Class<Feedback>("Feedback")({
  publicId: Schema.String,
  feedback: Schema.String,
  source: Schema.String,
  attachments: Schema.Array(AttachmentSchema),
  userId: Schema.NullOr(Schema.String),
  userEmail: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class CreateFeedbackInput extends Schema.Class<CreateFeedbackInput>(
  "CreateFeedbackInput",
)({
  feedback: Schema.String.pipe(Schema.minLength(10)),
  source: Schema.optionalWith(Schema.String, { default: () => "app" }),
  attachments: Schema.optional(Schema.Array(AttachmentSchema)),
  userId: Schema.optional(Schema.String),
  userEmail: Schema.optional(Schema.String),
}) {}
