import { Schema } from 'effect';

export const Session = Schema.Unknown;

export const Organization = Schema.Unknown;

export const AuthContract = {
  getSession: {
    success: Schema.NullOr(Session),
    error: Schema.Unknown,
    payload: Schema.Void,
  },
  getActiveOrganization: {
    success: Schema.NullOr(Organization),
    error: Schema.Unknown,
    payload: Schema.Void,
  },
} as const;
