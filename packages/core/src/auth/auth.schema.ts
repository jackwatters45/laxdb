import { Schema } from 'effect';
import { TimestampsSchema } from '../schema';

export class Session extends Schema.Class<Session>('Session')({
  id: Schema.String,
  expiresAt: Schema.String,
  token: Schema.String,
  ipAddress: Schema.NullOr(Schema.String),
  userAgent: Schema.NullOr(Schema.String),
  userId: Schema.String,
  activeOrganizationId: Schema.NullOr(Schema.String),
  activeTeamId: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class Account extends Schema.Class<Account>('Account')({
  id: Schema.String,
  accountId: Schema.String,
  providerId: Schema.String,
  userId: Schema.String,
  accessToken: Schema.NullOr(Schema.String),
  refreshToken: Schema.NullOr(Schema.String),
  idToken: Schema.NullOr(Schema.String),
  accessTokenExpiresAt: Schema.NullOr(Schema.String),
  refreshTokenExpiresAt: Schema.NullOr(Schema.String),
  scope: Schema.NullOr(Schema.String),
  password: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class Verification extends Schema.Class<Verification>('Verification')({
  id: Schema.String,
  identifier: Schema.String,
  value: Schema.String,
  expiresAt: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
}) {}
