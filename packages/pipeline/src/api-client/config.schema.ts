import { Schema } from "effect";

export const SharedClientConfigFields = {
  defaultHeaders: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  authHeader: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  maxRetries: Schema.optional(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  ),
  retryDelayMs: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
} as const;
