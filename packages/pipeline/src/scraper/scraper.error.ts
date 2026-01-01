import { Schema } from "effect";

export class ScraperError extends Schema.TaggedError<ScraperError>(
  "ScraperError",
)("ScraperError", {
  message: Schema.String,
  url: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.Number, { default: () => 500 }),
}) {}

export class ScraperHttpError extends Schema.TaggedError<ScraperHttpError>(
  "ScraperHttpError",
)("ScraperHttpError", {
  message: Schema.String,
  url: Schema.String,
  statusCode: Schema.Number,
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.Number, { default: () => 502 }),
}) {}

export class ScraperTimeoutError extends Schema.TaggedError<ScraperTimeoutError>(
  "ScraperTimeoutError",
)("ScraperTimeoutError", {
  message: Schema.String,
  url: Schema.String,
  timeoutMs: Schema.Number,
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.Number, { default: () => 408 }),
}) {}

export class ScraperRateLimitError extends Schema.TaggedError<ScraperRateLimitError>(
  "ScraperRateLimitError",
)("ScraperRateLimitError", {
  message: Schema.String,
  url: Schema.String,
  retryAfterMs: Schema.optional(Schema.Number),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.Number, { default: () => 429 }),
}) {}

export class ScraperNetworkError extends Schema.TaggedError<ScraperNetworkError>(
  "ScraperNetworkError",
)("ScraperNetworkError", {
  message: Schema.String,
  url: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.Number, { default: () => 503 }),
}) {}
