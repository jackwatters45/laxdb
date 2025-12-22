import { Schema } from 'effect';

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  domain: Schema.String,
  id: Schema.Union(Schema.Number, Schema.String),
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 404 }),
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>(
  'ValidationError'
)('ValidationError', {
  domain: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 400 }),
}) {}

export class DatabaseError extends Schema.TaggedError<DatabaseError>(
  'DatabaseError'
)('DatabaseError', {
  domain: Schema.optional(Schema.String),
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 500 }),
}) {}

export class ConstraintViolationError extends Schema.TaggedError<ConstraintViolationError>(
  'ConstraintViolationError'
)('ConstraintViolationError', {
  constraint: Schema.String,
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 400 }),
  detail: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class AuthenticationError extends Schema.TaggedError<AuthenticationError>(
  'AuthenticationError'
)('AuthenticationError', {
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 401 }),
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class AuthorizationError extends Schema.TaggedError<AuthorizationError>(
  'AuthorizationError'
)('AuthorizationError', {
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 403 }),
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}
