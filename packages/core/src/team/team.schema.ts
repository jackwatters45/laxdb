import { Schema } from 'effect';

export class CreateTeamInput extends Schema.Class<CreateTeamInput>(
  'CreateTeamInput'
)({
  name: Schema.String,
  description: Schema.optional(Schema.String),
}) {}

export class UpdateTeamInput extends Schema.Class<UpdateTeamInput>(
  'UpdateTeamInput'
)({
  teamId: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
}) {}

export class DeleteTeamInput extends Schema.Class<DeleteTeamInput>(
  'DeleteTeamInput'
)({
  teamId: Schema.String,
}) {}

export class GetTeamMembersInput extends Schema.Class<GetTeamMembersInput>(
  'GetTeamMembersInput'
)({
  teamId: Schema.String,
}) {}

export class InvitePlayerInput extends Schema.Class<InvitePlayerInput>(
  'InvitePlayerInput'
)({
  email: Schema.String,
  role: Schema.Literal('player'),
  teamId: Schema.optional(Schema.String),
}) {}

export class RemoveTeamMemberInput extends Schema.Class<RemoveTeamMemberInput>(
  'RemoveTeamMemberInput'
)({
  teamId: Schema.String,
  userId: Schema.String,
}) {}
