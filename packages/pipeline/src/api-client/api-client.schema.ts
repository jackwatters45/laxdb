import { Schema } from "effect";

export class ApiClientConfig extends Schema.Class<ApiClientConfig>(
  "ApiClientConfig",
)({
  baseUrl: Schema.String,
  defaultHeaders: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  authHeader: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number),
}) {}

export class ApiRequestOptions extends Schema.Class<ApiRequestOptions>(
  "ApiRequestOptions",
)({
  headers: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  timeoutMs: Schema.optional(Schema.Number),
  signal: Schema.optional(Schema.Unknown),
}) {}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
