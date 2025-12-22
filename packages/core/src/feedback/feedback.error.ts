import { Schema } from 'effect';

export class FeedbackOperationError extends Schema.TaggedError<FeedbackOperationError>(
  'FeedbackOperationError'
)('FeedbackOperationError', {
  message: Schema.String,
  feedbackId: Schema.optional(Schema.Number),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 500 }),
}) {}

export class FeedbackNotFoundError extends Schema.TaggedError<FeedbackNotFoundError>(
  'FeedbackNotFoundError'
)('FeedbackNotFoundError', {
  message: Schema.String,
  feedbackId: Schema.optional(Schema.Number),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 404 }),
}) {}
