import { Schema } from 'effect';

export class TeamNotFoundError extends Schema.TaggedError<TeamNotFoundError>(
  'TeamNotFoundError'
)('TeamNotFoundError', {
  message: Schema.String,
  teamId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 404 }),
}) {}

export class TeamOperationError extends Schema.TaggedError<TeamOperationError>(
  'TeamOperationError'
)('TeamOperationError', {
  message: Schema.String,
  teamId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 500 }),
}) {}

export class TeamMemberError extends Schema.TaggedError<TeamMemberError>(
  'TeamMemberError'
)('TeamMemberError', {
  message: Schema.String,
  teamId: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 400 }),
}) {}
