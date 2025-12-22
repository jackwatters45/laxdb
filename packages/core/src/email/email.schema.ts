import { Schema } from 'effect';
import { EmailSchema } from '../schema';

export class Email extends Schema.Class<Email>('Email')({
  to: Schema.Array(EmailSchema),
  subject: Schema.String,
  htmlBody: Schema.String,
  textBody: Schema.NullOr(Schema.String),
  from: Schema.NullOr(EmailSchema),
}) {}

export class SendEmailInput extends Schema.Class<SendEmailInput>(
  'SendEmailInput'
)({
  to: Schema.Array(EmailSchema),
  subject: Schema.String,
  htmlBody: Schema.String,
  textBody: Schema.optional(Schema.String),
  from: Schema.optional(EmailSchema),
}) {}

export class SendFeedbackEmailInput extends Schema.Class<SendFeedbackEmailInput>(
  'SendFeedbackEmailInput'
)({
  feedbackId: Schema.Number,
  topic: Schema.String,
  rating: Schema.String,
  feedback: Schema.String,
  userEmail: Schema.optional(EmailSchema),
  userId: Schema.optional(Schema.String),
}) {}
