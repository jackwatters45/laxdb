import { Schema } from "effect";

export class ParserError extends Schema.TaggedError<ParserError>("ParserError")(
  "ParserError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optionalWith(Schema.Number, { default: () => 422 }),
  },
) {}

export class SelectorError extends Schema.TaggedError<SelectorError>(
  "SelectorError",
)("SelectorError", {
  message: Schema.String,
  selector: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.Number, { default: () => 400 }),
}) {}
