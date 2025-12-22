import { Schema } from 'effect';
import { EmailSchema, TimestampsSchema } from '../schema';

export class User extends Schema.Class<User>('User')({
  id: Schema.String,
  name: Schema.String,
  email: EmailSchema,
  emailVerified: Schema.Boolean,
  image: Schema.NullOr(Schema.String),
  role: Schema.NullOr(Schema.String),
  banned: Schema.NullOr(Schema.Boolean),
  banReason: Schema.NullOr(Schema.String),
  banExpires: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class GetUserFromEmailInput extends Schema.Class<GetUserFromEmailInput>(
  'GetUserFromEmailInput'
)({
  email: EmailSchema,
}) {}
