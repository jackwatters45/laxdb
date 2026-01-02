import { Schema } from "effect";

/**
 * HTTP response error (non-2xx status code).
 * The `url` field is required since this error only occurs after making a request.
 */
export class HttpError extends Schema.TaggedError<HttpError>("HttpError")(
  "HttpError",
  {
    message: Schema.String,
    url: Schema.String,
    method: Schema.optional(Schema.String),
    statusCode: Schema.optional(Schema.Number),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

/**
 * Network-level error (connection refused, DNS failure, etc.).
 * The `url` field is required since this error only occurs when attempting a request.
 */
export class NetworkError extends Schema.TaggedError<NetworkError>(
  "NetworkError",
)("NetworkError", {
  message: Schema.String,
  url: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Request timeout error.
 * The `url` field is required since this error only occurs when a request times out.
 */
export class TimeoutError extends Schema.TaggedError<TimeoutError>(
  "TimeoutError",
)("TimeoutError", {
  message: Schema.String,
  url: Schema.String,
  timeoutMs: Schema.optional(Schema.Number),
}) {}

/**
 * Rate limit error (HTTP 429).
 * The `url` field is required since this error only occurs from a server response.
 */
export class RateLimitError extends Schema.TaggedError<RateLimitError>(
  "RateLimitError",
)("RateLimitError", {
  message: Schema.String,
  url: Schema.String,
  retryAfterMs: Schema.optional(Schema.Number),
}) {}

/**
 * Schema parsing/validation error.
 * The `url` field is optional because this error can occur during:
 * - Input validation (before any request is made, no URL available)
 * - Response parsing (URL is available)
 */
export class ParseError extends Schema.TaggedError<ParseError>("ParseError")(
  "ParseError",
  {
    message: Schema.String,
    url: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export type PipelineError =
  | HttpError
  | NetworkError
  | TimeoutError
  | RateLimitError
  | ParseError;
