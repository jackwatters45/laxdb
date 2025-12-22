import { Schema } from 'effect';
import { TimestampsSchema } from '../schema';

export const TOPIC_ENUM = [
  'feature-request',
  'bug-report',
  'user-interface',
  'performance',
  'documentation',
  'other',
] as const;

export const RATING_ENUM = ['positive', 'neutral', 'negative'] as const;

export const TopicSchema = Schema.Literal(...TOPIC_ENUM);
export const RatingSchema = Schema.Literal(...RATING_ENUM);

export class Feedback extends Schema.Class<Feedback>('Feedback')({
  publicId: Schema.String,
  topic: TopicSchema,
  rating: RatingSchema,
  feedback: Schema.String,
  userId: Schema.NullOr(Schema.String),
  userEmail: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class CreateFeedbackInput extends Schema.Class<CreateFeedbackInput>(
  'CreateFeedbackInput'
)({
  topic: TopicSchema,
  rating: RatingSchema,
  feedback: Schema.String.pipe(Schema.minLength(10)),
  userId: Schema.NullOr(Schema.String),
  userEmail: Schema.NullOr(Schema.String),
}) {}
