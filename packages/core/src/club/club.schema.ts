import { Schema } from "effect";

export const Id = Schema.String.check(Schema.isMinLength(1));
export const NullableId = Schema.NullOr(Id);

export const JerseyNumber = Schema.Number.check(
  Schema.isInt({ message: "Jersey number must be a whole number" }),
  Schema.isGreaterThanOrEqualTo(0, {
    message: "Jersey number must be 0 or greater",
  }),
);

export const RecipientEmail = Schema.String.check(
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: "Please enter a valid email address",
  }),
);

export class ClubTeam extends Schema.Class<ClubTeam>("ClubTeam")({
  id: Id,
  organizationId: Id,
  name: Schema.String,
  gamedayCompId: NullableId,
  gamedayTeamId: NullableId,
  coachMemberId: NullableId,
  createdAt: Schema.Date,
}) {}

export class RosterPlayer extends Schema.Class<RosterPlayer>("RosterPlayer")({
  id: Id,
  organizationId: Id,
  teamId: Id,
  name: Schema.String,
  jerseyNumber: Schema.NullOr(JerseyNumber),
  active: Schema.Boolean,
  createdAt: Schema.Date,
}) {}

export class ReportRecipient extends Schema.Class<ReportRecipient>(
  "ReportRecipient",
)({
  id: Id,
  organizationId: Id,
  teamId: NullableId,
  label: Schema.String,
  email: Schema.String,
  createdAt: Schema.Date,
}) {}

export class ClubOrganizationScopedInput extends Schema.Class<ClubOrganizationScopedInput>(
  "ClubOrganizationScopedInput",
)({
  organizationId: Id,
}) {}

export class TeamByIdInput extends Schema.Class<TeamByIdInput>("TeamByIdInput")(
  {
    organizationId: Id,
    id: Id,
  },
) {}

export class TeamScopedInput extends Schema.Class<TeamScopedInput>(
  "TeamScopedInput",
)({
  organizationId: Id,
  teamId: Id,
}) {}

export class CreateTeamInput extends Schema.Class<CreateTeamInput>(
  "CreateTeamInput",
)({
  organizationId: Id,
  name: Schema.String.check(Schema.isMinLength(1), Schema.isTrimmed()),
  gamedayCompId: Schema.optional(NullableId),
  gamedayTeamId: Schema.optional(NullableId),
  coachMemberId: Schema.optional(NullableId),
}) {}

export class UpdateTeamInput extends Schema.Class<UpdateTeamInput>(
  "UpdateTeamInput",
)({
  organizationId: Id,
  id: Id,
  name: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isTrimmed()),
  ),
  gamedayCompId: Schema.optional(NullableId),
  gamedayTeamId: Schema.optional(NullableId),
  coachMemberId: Schema.optional(NullableId),
}) {}

export class AddRosterPlayerInput extends Schema.Class<AddRosterPlayerInput>(
  "AddRosterPlayerInput",
)({
  organizationId: Id,
  teamId: Id,
  name: Schema.String.check(Schema.isMinLength(1), Schema.isTrimmed()),
  jerseyNumber: Schema.optional(Schema.NullOr(JerseyNumber)),
}) {}

export class UpdateRosterPlayerInput extends Schema.Class<UpdateRosterPlayerInput>(
  "UpdateRosterPlayerInput",
)({
  organizationId: Id,
  id: Id,
  name: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isTrimmed()),
  ),
  jerseyNumber: Schema.optional(Schema.NullOr(JerseyNumber)),
  active: Schema.optional(Schema.Boolean),
}) {}

export class RosterPlayerByIdInput extends Schema.Class<RosterPlayerByIdInput>(
  "RosterPlayerByIdInput",
)({
  organizationId: Id,
  id: Id,
}) {}

export class AddRecipientInput extends Schema.Class<AddRecipientInput>(
  "AddRecipientInput",
)({
  organizationId: Id,
  teamId: Schema.optional(NullableId),
  label: Schema.String.check(Schema.isMinLength(1), Schema.isTrimmed()),
  email: RecipientEmail,
}) {}

export class RecipientByIdInput extends Schema.Class<RecipientByIdInput>(
  "RecipientByIdInput",
)({
  organizationId: Id,
  id: Id,
}) {}

export class MemberByIdInput extends Schema.Class<MemberByIdInput>(
  "MemberByIdInput",
)({
  organizationId: Id,
  id: Id,
}) {}
