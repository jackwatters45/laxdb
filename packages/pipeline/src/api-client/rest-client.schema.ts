import { Schema } from "effect";

export class RestClientConfig extends Schema.Class<RestClientConfig>(
  "RestClientConfig",
)({
  baseUrl: Schema.String,
  defaultHeaders: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  authHeader: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  maxRetries: Schema.optional(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  ),
  retryDelayMs: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
}) {}

export class RestRequestOptions extends Schema.Class<RestRequestOptions>(
  "RestRequestOptions",
)({
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  timeoutMs: Schema.optional(Schema.Number),
  signal: Schema.optional(Schema.Unknown),
}) {}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
