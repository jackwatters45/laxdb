import { Schema } from "effect";

export class ScrapeRequest extends Schema.Class<ScrapeRequest>("ScrapeRequest")(
  {
    url: Schema.String.check(
      Schema.isPattern(/^https?:\/\//, {
        message: "Invalid URL format",
      }),
    ),
    headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
    timeoutMs: Schema.optional(Schema.Number),
    followRedirects: Schema.optional(Schema.Boolean).pipe(Schema.withDecodingDefault(() => true,
    )),
  },
) {}

export class ScrapeResponse extends Schema.Class<ScrapeResponse>(
  "ScrapeResponse",
)({
  url: Schema.String,
  finalUrl: Schema.String,
  statusCode: Schema.Number,
  headers: Schema.Record(Schema.String, Schema.String),
  body: Schema.String,
  contentType: Schema.NullOr(Schema.String),
  fetchedAt: Schema.Date,
  durationMs: Schema.Number,
}) {}

export class BatchScrapeRequest extends Schema.Class<BatchScrapeRequest>(
  "BatchScrapeRequest",
)({
  urls: Schema.Array(Schema.String),
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  timeoutMs: Schema.optional(Schema.Number),
  concurrency: Schema.optional(Schema.Number),
}) {}

export class ScrapeResult extends Schema.Class<ScrapeResult>("ScrapeResult")({
  url: Schema.String,
  success: Schema.Boolean,
  response: Schema.optional(ScrapeResponse),
  error: Schema.optional(Schema.String),
}) {}

export class BatchScrapeResponse extends Schema.Class<BatchScrapeResponse>(
  "BatchScrapeResponse",
)({
  results: Schema.Array(ScrapeResult),
  totalCount: Schema.Number,
  successCount: Schema.Number,
  failureCount: Schema.Number,
  totalDurationMs: Schema.Number,
}) {}
