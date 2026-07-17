import { Schema } from "effect";

export const Id = Schema.String.check(Schema.isMinLength(1));
export const NullableId = Schema.NullOr(Id);

const Score = Schema.Number.check(
  Schema.isInt({ message: "Score must be a whole number" }),
);

const MatchImageContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] satisfies readonly ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const MatchImageContentType = Schema.Literals(MatchImageContentTypes);

const ImageSizeBytes = Schema.Number.check(
  Schema.isInt({ message: "Image size must be a whole number" }),
  Schema.isGreaterThan(0, { message: "Image cannot be empty" }),
  Schema.isLessThanOrEqualTo(10_000_000, {
    message: "Image must be 10MB or smaller",
  }),
);

export class Fixture extends Schema.Class<Fixture>("Fixture")({
  id: Id,
  organizationId: Id,
  teamId: Id,
  gamedayFixtureId: Id,
  compId: NullableId,
  compName: Schema.NullOr(Schema.String),
  round: Schema.NullOr(Schema.String),
  scheduledAt: Schema.NullOr(Schema.Date),
  homeTeamName: Schema.String,
  awayTeamName: Schema.String,
  isHome: Schema.Boolean,
  venueName: Schema.NullOr(Schema.String),
  matchStatus: Schema.NullOr(Schema.String),
  homeScore: Schema.NullOr(Score),
  awayScore: Schema.NullOr(Score),
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class MatchImage extends Schema.Class<MatchImage>("MatchImage")({
  id: Id,
  organizationId: Id,
  fixtureId: Id,
  uploadedByUserId: NullableId,
  objectKey: Id,
  fileName: Schema.String,
  contentType: MatchImageContentType,
  sizeBytes: ImageSizeBytes,
  createdAt: Schema.Date,
}) {}

export class MatchReport extends Schema.Class<MatchReport>("MatchReport")({
  id: Id,
  organizationId: Id,
  fixtureId: Id,
  teamId: Id,
  submittedByUserId: NullableId,
  topPlayer1Id: Id,
  topPlayer2Id: NullableId,
  topPlayer3Id: NullableId,
  blurb: Schema.NullOr(Schema.String),
  sentTo: Schema.Array(Schema.String),
  sentAt: Schema.NullOr(Schema.Date),
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class ListFixturesInput extends Schema.Class<ListFixturesInput>(
  "ListFixturesInput",
)({
  organizationId: Id,
  teamId: Schema.optional(Id),
}) {}

export class FixtureByIdInput extends Schema.Class<FixtureByIdInput>(
  "FixtureByIdInput",
)({
  organizationId: Id,
  id: Id,
}) {}

export class SyncFixturesInput extends Schema.Class<SyncFixturesInput>(
  "SyncFixturesInput",
)({
  organizationId: Id,
  teamId: Id,
}) {}

export class SyncFixturesResult extends Schema.Class<SyncFixturesResult>(
  "SyncFixturesResult",
)({
  synced: Schema.Number.check(Schema.isInt()),
  compName: Schema.NullOr(Schema.String),
}) {}

export class SubmitReportInput extends Schema.Class<SubmitReportInput>(
  "SubmitReportInput",
)({
  organizationId: Id,
  fixtureId: Id,
  submittedByUserId: Schema.optional(NullableId),
  submitterName: Schema.optional(Schema.NullOr(Schema.String)),
  topPlayer1Id: Id,
  topPlayer2Id: Schema.optional(NullableId),
  topPlayer3Id: Schema.optional(NullableId),
  blurb: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class ListReportsInput extends Schema.Class<ListReportsInput>(
  "ListReportsInput",
)({
  organizationId: Id,
  teamId: Schema.optional(Id),
}) {}

export class ListMatchImagesInput extends Schema.Class<ListMatchImagesInput>(
  "ListMatchImagesInput",
)({
  organizationId: Id,
  fixtureId: Id,
}) {}

export class GetMatchImageInput extends Schema.Class<GetMatchImageInput>(
  "GetMatchImageInput",
)({
  organizationId: Id,
  id: Id,
}) {}

export class CreateMatchImageInput extends Schema.Class<CreateMatchImageInput>(
  "CreateMatchImageInput",
)({
  organizationId: Id,
  fixtureId: Id,
  uploadedByUserId: Schema.optional(NullableId),
  fileName: Schema.String.check(
    Schema.isMinLength(1, { message: "Image filename is required" }),
  ),
  contentType: MatchImageContentType,
  sizeBytes: ImageSizeBytes,
}) {}

export class DeleteMatchImageInput extends Schema.Class<DeleteMatchImageInput>(
  "DeleteMatchImageInput",
)({
  organizationId: Id,
  id: Id,
}) {}
