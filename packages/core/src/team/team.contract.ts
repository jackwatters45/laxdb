import { Schema } from 'effect';
import {
  CreateTeamInput,
  DeleteTeamInput,
  GetTeamMembersInput,
  InvitePlayerInput,
  RemoveTeamMemberInput,
  UpdateTeamInput,
} from './team.schema';

export const Team = Schema.Unknown;

export const TeamMember = Schema.Unknown;

export const TeamContract = {
  create: {
    success: Team,
    error: Schema.Unknown,
    payload: CreateTeamInput,
  },
  update: {
    success: Team,
    error: Schema.Unknown,
    payload: UpdateTeamInput,
  },
  delete: {
    success: Schema.Void,
    error: Schema.Unknown,
    payload: DeleteTeamInput,
  },
  getMembers: {
    success: Schema.Array(TeamMember),
    error: Schema.Unknown,
    payload: GetTeamMembersInput,
  },
  invitePlayer: {
    success: Schema.Void,
    error: Schema.Unknown,
    payload: InvitePlayerInput,
  },
  removeMember: {
    success: Schema.Void,
    error: Schema.Unknown,
    payload: RemoveTeamMemberInput,
  },
} as const;
