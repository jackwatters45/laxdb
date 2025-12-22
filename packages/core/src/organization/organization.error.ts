import { Schema } from 'effect';

export class OrganizationNotFoundError extends Schema.TaggedError<OrganizationNotFoundError>(
  'OrganizationNotFoundError'
)('OrganizationNotFoundError', {
  message: Schema.String,
  organizationId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 404 }),
}) {}

export class OrganizationOperationError extends Schema.TaggedError<OrganizationOperationError>(
  'OrganizationOperationError'
)('OrganizationOperationError', {
  message: Schema.String,
  organizationId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 500 }),
}) {}

export class OrganizationSlugError extends Schema.TaggedError<OrganizationSlugError>(
  'OrganizationSlugError'
)('OrganizationSlugError', {
  message: Schema.String,
  slug: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 400 }),
}) {}

export class InvitationOperationError extends Schema.TaggedError<InvitationOperationError>(
  'InvitationOperationError'
)('InvitationOperationError', {
  message: Schema.String,
  invitationId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optionalWith(Schema.NumberFromString, { default: () => 400 }),
}) {}
