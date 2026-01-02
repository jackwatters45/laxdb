import { Schema } from "effect";

export class RestClientConfig extends Schema.Class<RestClientConfig>(
  "RestClientConfig",
)({
  baseUrl: Schema.String,
  defaultHeaders: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  authHeader: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number),
}) {}

export class RestRequestOptions extends Schema.Class<RestRequestOptions>(
  "RestRequestOptions",
)({
  headers: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  timeoutMs: Schema.optional(Schema.Number),
  signal: Schema.optional(Schema.Unknown),
}) {}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
