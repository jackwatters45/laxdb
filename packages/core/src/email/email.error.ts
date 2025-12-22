import { Schema } from 'effect';

export class EmailSendError extends Schema.TaggedError<EmailSendError>(
  'EmailSendError'
)('EmailSendError', {
  message: Schema.String,
  recipient: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 500 }),
}) {}

export class EmailValidationError extends Schema.TaggedError<EmailValidationError>(
  'EmailValidationError'
)('EmailValidationError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 400 }),
}) {}
