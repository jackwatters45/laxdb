import { Schema } from 'effect';
import {
  AcceptInvitationInput,
  CreateOrganizationInput,
} from './organization.schema';

export const Organization = Schema.Unknown;

export const DashboardData = Schema.Unknown;

export const OrganizationContract = {
  create: {
    success: Schema.Struct({
      teamId: Schema.String,
    }),
    error: Schema.Unknown,
    payload: CreateOrganizationInput,
  },
  acceptInvitation: {
    success: Schema.Unknown,
    error: Schema.Unknown,
    payload: AcceptInvitationInput,
  },
  getUserOrganizationContext: {
    success: DashboardData,
    error: Schema.Unknown,
    payload: Schema.Void,
  },
} as const;
