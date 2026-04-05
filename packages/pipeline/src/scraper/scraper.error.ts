import { Schema } from "effect";

export class ScraperError extends Schema.TaggedErrorClass<ScraperError>()(
  "ScraperError",
  {
  message: Schema.String,
  url: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.Number).pipe(Schema.withDecodingDefault(() => 500 )),
}) {}

export class ScraperHttpError extends Schema.TaggedErrorClass<ScraperHttpError>()(
  "ScraperHttpError",
  {
  message: Schema.String,
  url: Schema.String,
  statusCode: Schema.Number,
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.Number).pipe(Schema.withDecodingDefault(() => 502 )),
}) {}

export class ScraperTimeoutError extends Schema.TaggedErrorClass<ScraperTimeoutError>()(
  "ScraperTimeoutError",
  {
  message: Schema.String,
  url: Schema.String,
  timeoutMs: Schema.Number,
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.Number).pipe(Schema.withDecodingDefault(() => 408 )),
}) {}

export class ScraperRateLimitError extends Schema.TaggedErrorClass<ScraperRateLimitError>()(
  "ScraperRateLimitError",
  {
  message: Schema.String,
  url: Schema.String,
  retryAfterMs: Schema.optional(Schema.Number),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.Number).pipe(Schema.withDecodingDefault(() => 429 )),
}) {}

export class ScraperNetworkError extends Schema.TaggedErrorClass<ScraperNetworkError>()(
  "ScraperNetworkError",
  {
  message: Schema.String,
  url: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.Number).pipe(Schema.withDecodingDefault(() => 503 )),
}) {}
