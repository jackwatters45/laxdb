import { Schema } from "effect";

export class ParserError extends Schema.TaggedErrorClass<ParserError>()(
  "ParserError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optional(Schema.Number).pipe(
      Schema.withDecodingDefault(() => 422),
    ),
  },
) {}

export class SelectorError extends Schema.TaggedErrorClass<SelectorError>()(
  "SelectorError",
  {
    message: Schema.String,
    selector: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optional(Schema.Number).pipe(
      Schema.withDecodingDefault(() => 400),
    ),
  },
) {}
