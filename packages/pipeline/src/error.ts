import { Schema } from "effect";

export class HttpError extends Schema.TaggedError<HttpError>("HttpError")(
  "HttpError",
  {
    message: Schema.String,
    url: Schema.optional(Schema.String),
    method: Schema.optional(Schema.String),
    statusCode: Schema.optional(Schema.Number),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class NetworkError extends Schema.TaggedError<NetworkError>(
  "NetworkError",
)("NetworkError", {
  message: Schema.String,
  url: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class TimeoutError extends Schema.TaggedError<TimeoutError>(
  "TimeoutError",
)("TimeoutError", {
  message: Schema.String,
  url: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number),
}) {}

export class RateLimitError extends Schema.TaggedError<RateLimitError>(
  "RateLimitError",
)("RateLimitError", {
  message: Schema.String,
  url: Schema.optional(Schema.String),
  retryAfterMs: Schema.optional(Schema.Number),
}) {}

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
