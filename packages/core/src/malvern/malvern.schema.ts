import { Schema } from "effect";

export const MalvernId = Schema.String.check(Schema.isMinLength(1));
export const NullableMalvernId = Schema.NullOr(MalvernId);

export const NonEmptyTrimmedString = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isTrimmed(),
);

export const EmailAddress = Schema.String.check(
  Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u, {
    message: "Please enter a valid email address",
  }),
);

export const RecipientEmails = Schema.Array(EmailAddress);

export const FixtureHomeAway = Schema.Literals([
  "home",
  "away",
  "neutral",
  "unknown",
]);
export type FixtureHomeAway = typeof FixtureHomeAway.Type;

export class MalvernTeam extends Schema.Class<MalvernTeam>("MalvernTeam")({
  publicId: MalvernId,
  organizationId: MalvernId,
  name: NonEmptyTrimmedString,
  grade: Schema.NullOr(Schema.String),
  sourceUrl: Schema.NullOr(Schema.String),
  defaultRecipientEmails: RecipientEmails,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class MalvernTeamCoach extends Schema.Class<MalvernTeamCoach>(
  "MalvernTeamCoach",
)({
  publicId: MalvernId,
  organizationId: MalvernId,
  teamPublicId: MalvernId,
  coachUserId: MalvernId,
  coachName: Schema.String,
  coachEmail: Schema.String,
  createdAt: Schema.Date,
}) {}

export class MalvernPlayer extends Schema.Class<MalvernPlayer>("MalvernPlayer")(
  {
    publicId: MalvernId,
    organizationId: MalvernId,
    teamPublicId: MalvernId,
    name: NonEmptyTrimmedString,
    jumperNumber: Schema.NullOr(Schema.Number),
    active: Schema.Boolean,
    createdAt: Schema.Date,
    updatedAt: Schema.NullOr(Schema.Date),
  },
) {}

export class MalvernFixture extends Schema.Class<MalvernFixture>(
  "MalvernFixture",
)({
  publicId: MalvernId,
  organizationId: MalvernId,
  teamPublicId: MalvernId,
  externalFixtureId: Schema.NullOr(Schema.String),
  roundLabel: Schema.String,
  startsAt: Schema.NullOr(Schema.Date),
  venue: Schema.NullOr(Schema.String),
  opponent: Schema.String,
  homeAway: FixtureHomeAway,
  malvernScore: Schema.NullOr(Schema.Number),
  opponentScore: Schema.NullOr(Schema.Number),
  sourceUrl: Schema.NullOr(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class MalvernTopThreeSubmission extends Schema.Class<MalvernTopThreeSubmission>(
  "MalvernTopThreeSubmission",
)({
  publicId: MalvernId,
  organizationId: MalvernId,
  fixturePublicId: MalvernId,
  submittedByUserId: MalvernId,
  firstPlayerPublicId: MalvernId,
  secondPlayerPublicId: MalvernId,
  thirdPlayerPublicId: MalvernId,
  blurb: Schema.NullOr(Schema.String),
  recipientEmails: RecipientEmails,
  emailSubject: Schema.String,
  emailBody: Schema.String,
  emailedAt: Schema.NullOr(Schema.Date),
  createdAt: Schema.Date,
}) {}

export class OrganizationScopedMalvernInput extends Schema.Class<OrganizationScopedMalvernInput>(
  "OrganizationScopedMalvernInput",
)({
  organizationId: MalvernId,
}) {}

export class ListMalvernTeamsInput extends Schema.Class<ListMalvernTeamsInput>(
  "ListMalvernTeamsInput",
)({
  organizationId: MalvernId,
  viewerUserId: Schema.optional(Schema.String),
  includeAll: Schema.optional(Schema.Boolean),
}) {}

export class TeamScopedInput extends Schema.Class<TeamScopedInput>(
  "TeamScopedInput",
)({
  organizationId: MalvernId,
  teamPublicId: MalvernId,
}) {}

export class CreateMalvernTeamInput extends Schema.Class<CreateMalvernTeamInput>(
  "CreateMalvernTeamInput",
)({
  organizationId: MalvernId,
  name: NonEmptyTrimmedString,
  grade: Schema.optional(Schema.NullOr(Schema.String)),
  sourceUrl: Schema.optional(Schema.NullOr(Schema.String)),
  defaultRecipientEmails: Schema.optional(RecipientEmails),
}) {}

export class UpdateMalvernTeamInput extends Schema.Class<UpdateMalvernTeamInput>(
  "UpdateMalvernTeamInput",
)({
  organizationId: MalvernId,
  teamPublicId: MalvernId,
  name: Schema.optional(NonEmptyTrimmedString),
  grade: Schema.optional(Schema.NullOr(Schema.String)),
  sourceUrl: Schema.optional(Schema.NullOr(Schema.String)),
  defaultRecipientEmails: Schema.optional(RecipientEmails),
}) {}

export class AssignMalvernCoachInput extends Schema.Class<AssignMalvernCoachInput>(
  "AssignMalvernCoachInput",
)({
  organizationId: MalvernId,
  teamPublicId: MalvernId,
  coachUserId: MalvernId,
}) {}

export class CreateMalvernPlayerInput extends Schema.Class<CreateMalvernPlayerInput>(
  "CreateMalvernPlayerInput",
)({
  organizationId: MalvernId,
  teamPublicId: MalvernId,
  name: NonEmptyTrimmedString,
  jumperNumber: Schema.optional(Schema.NullOr(Schema.Number)),
}) {}

export class UpdateMalvernPlayerInput extends Schema.Class<UpdateMalvernPlayerInput>(
  "UpdateMalvernPlayerInput",
)({
  organizationId: MalvernId,
  publicId: MalvernId,
  name: Schema.optional(NonEmptyTrimmedString),
  jumperNumber: Schema.optional(Schema.NullOr(Schema.Number)),
  active: Schema.optional(Schema.Boolean),
}) {}

export class SyncMalvernFixturesInput extends Schema.Class<SyncMalvernFixturesInput>(
  "SyncMalvernFixturesInput",
)({
  organizationId: MalvernId,
  teamPublicId: MalvernId,
  sourceUrl: Schema.optional(Schema.NullOr(Schema.String)),
  sourceText: Schema.String,
}) {}

export class SubmitTopThreeInput extends Schema.Class<SubmitTopThreeInput>(
  "SubmitTopThreeInput",
)({
  organizationId: MalvernId,
  fixturePublicId: MalvernId,
  submittedByUserId: MalvernId,
  firstPlayerPublicId: MalvernId,
  secondPlayerPublicId: MalvernId,
  thirdPlayerPublicId: MalvernId,
  blurb: Schema.optional(Schema.NullOr(Schema.String)),
  recipientEmails: RecipientEmails,
}) {}

export class ListTopThreeSubmissionsInput extends Schema.Class<ListTopThreeSubmissionsInput>(
  "ListTopThreeSubmissionsInput",
)({
  organizationId: MalvernId,
  teamPublicId: Schema.optional(MalvernId),
}) {}

export class FixtureImportResult extends Schema.Class<FixtureImportResult>(
  "FixtureImportResult",
)({
  fixtures: Schema.Array(MalvernFixture),
  imported: Schema.Number,
}) {}
