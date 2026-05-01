import { Schema } from "effect";

export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()(
  "NotFoundError",
  {
    domain: Schema.String,
    id: Schema.Union([Schema.Number, Schema.String]),
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optional(Schema.Number),
  },
) {}

export class ValidationError extends Schema.TaggedErrorClass<ValidationError>()(
  "ValidationError",
  {
    domain: Schema.optional(Schema.String),
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optional(Schema.Number),
  },
) {}

export class DatabaseError extends Schema.TaggedErrorClass<DatabaseError>()(
  "DatabaseError",
  {
    domain: Schema.optional(Schema.String),
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optional(Schema.Number),
    sqlCode: Schema.optional(Schema.String),
  },
) {}

export class ConstraintViolationError extends Schema.TaggedErrorClass<ConstraintViolationError>()(
  "ConstraintViolationError",
  {
    constraint: Schema.String,
    code: Schema.optional(Schema.Number),
    detail: Schema.optional(Schema.String),
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
    sqlCode: Schema.optional(Schema.String),
  },
) {}

export class AuthenticationError extends Schema.TaggedErrorClass<AuthenticationError>()(
  "AuthenticationError",
  {
    code: Schema.optional(Schema.Number),
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class AuthorizationError extends Schema.TaggedErrorClass<AuthorizationError>()(
  "AuthorizationError",
  {
    code: Schema.optional(Schema.Number),
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}
