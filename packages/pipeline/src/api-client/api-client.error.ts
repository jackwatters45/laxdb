import { Schema } from "effect";

export class ApiError extends Schema.TaggedError<ApiError>("ApiError")(
  "ApiError",
  {
    message: Schema.String,
    endpoint: Schema.optional(Schema.String),
    method: Schema.optional(Schema.String),
    statusCode: Schema.optional(Schema.Number),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ApiNetworkError extends Schema.TaggedError<ApiNetworkError>(
  "ApiNetworkError",
)("ApiNetworkError", {
  message: Schema.String,
  endpoint: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class ApiTimeoutError extends Schema.TaggedError<ApiTimeoutError>(
  "ApiTimeoutError",
)("ApiTimeoutError", {
  message: Schema.String,
  endpoint: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number),
}) {}

export class ApiRateLimitError extends Schema.TaggedError<ApiRateLimitError>(
  "ApiRateLimitError",
)("ApiRateLimitError", {
  message: Schema.String,
  endpoint: Schema.optional(Schema.String),
  retryAfterMs: Schema.optional(Schema.Number),
}) {}

export class ApiSchemaError extends Schema.TaggedError<ApiSchemaError>(
  "ApiSchemaError",
)("ApiSchemaError", {
  message: Schema.String,
  endpoint: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export type ApiClientError =
  | ApiError
  | ApiNetworkError
  | ApiTimeoutError
  | ApiRateLimitError
  | ApiSchemaError;
