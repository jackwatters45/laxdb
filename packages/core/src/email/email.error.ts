import { Schema } from "effect";

export class EmailDeliveryError extends Schema.TaggedErrorClass<EmailDeliveryError>()(
  "EmailDeliveryError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optional(Schema.Number),
  },
) {}
