import type {
  Member,
  Organization,
  Team,
  TeamMember,
} from 'better-auth/plugins';
import { Schema } from 'effect';

export class CreateOrganizationInput extends Schema.Class<CreateOrganizationInput>(
  'CreateOrganizationInput'
)({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Club name is required' }),
    Schema.minLength(3, {
      message: () => 'Club name must be at least 3 characters',
    }),
    Schema.maxLength(100, {
      message: () => 'Club name must be less than 100 characters',
    })
  ),
  slug: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Club slug is required' }),
    Schema.minLength(3, {
      message: () => 'Club slug must be at least 3 characters',
    }),
    Schema.maxLength(50, {
      message: () => 'Club slug must be less than 50 characters',
    }),
    Schema.filter((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: () =>
        'Club slug can only contain lowercase letters, numbers, and hyphens',
    })
  ),
}) {}

export class AcceptInvitationInput extends Schema.Class<AcceptInvitationInput>(
  'AcceptInvitationInput'
)({
  invitationId: Schema.String,
}) {}

export type DashboardData = {
  activeOrganization: Organization;
  teams: (Team & { members: TeamMember[] })[];
  activeMember: Member | null;
  canManageTeams: boolean;
};
