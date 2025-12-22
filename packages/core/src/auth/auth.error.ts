import { Schema } from 'effect';

export class InvitationError extends Schema.TaggedError<InvitationError>(
  'InvitationError'
)('InvitationError', {
  message: Schema.String,
  invitationId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class OrganizationMembershipError extends Schema.TaggedError<OrganizationMembershipError>(
  'OrganizationMembershipError'
)('OrganizationMembershipError', {
  message: Schema.String,
  organizationId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class TeamMembershipError extends Schema.TaggedError<TeamMembershipError>(
  'TeamMembershipError'
)('TeamMembershipError', {
  message: Schema.String,
  teamId: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}
