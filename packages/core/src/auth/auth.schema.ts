import { Schema } from "effect";

export const Role = Schema.Literals(["owner", "admin", "member"]);
export type Role = typeof Role.Type;

export const AuthUser = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
});

export const AuthSession = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  activeOrganizationId: Schema.optional(Schema.NullOr(Schema.String)),
});

export const AuthSessionResult = Schema.Struct({
  user: AuthUser,
  session: AuthSession,
});

export const ActiveMember = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  role: Role,
});

export const Me = Schema.Struct({
  userId: Schema.String,
  userName: Schema.String,
  userEmail: Schema.String,
  activeOrganizationId: Schema.NullOr(Schema.String),
  activeMemberId: Schema.NullOr(Schema.String),
  memberRole: Schema.NullOr(Role),
});
export type Me = typeof Me.Type;
