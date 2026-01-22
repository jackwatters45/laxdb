import { Schema } from "effect";

import {
  DateSchema,
  NullableTeamIdSchema,
  OrganizationIdSchema,
  PublicIdSchema,
  TeamIdSchema,
  TimestampsSchema,
} from "../schema";

import { seasonStatusEnum } from "./season.sql";

export class Season extends Schema.Class<Season>("Season")({
  publicId: PublicIdSchema.publicId,
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  name: Schema.String,
  startDate: DateSchema,
  endDate: Schema.NullOr(DateSchema),
  status: Schema.Literal(...seasonStatusEnum.enumValues),
  division: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class GetAllSeasonsInput extends Schema.Class<GetAllSeasonsInput>(
  "GetAllSeasonsInput",
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
}) {}

export class GetSeasonInput extends Schema.Class<GetSeasonInput>(
  "GetSeasonInput",
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
  publicId: PublicIdSchema.publicId,
}) {}

export class CreateSeasonInput extends Schema.Class<CreateSeasonInput>(
  "CreateSeasonInput",
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Season name is required" }),
    Schema.maxLength(60, {
      message: () => "Season name must be 60 characters or less",
    }),
    Schema.trimmed(),
  ),
  startDate: DateSchema,
  endDate: Schema.NullOr(DateSchema),
  status: Schema.Literal(...seasonStatusEnum.enumValues).pipe(Schema.optional),
  division: Schema.NullOr(Schema.String),
}) {}

export class UpdateSeasonInput extends Schema.Class<UpdateSeasonInput>(
  "UpdateSeasonInput",
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
  publicId: PublicIdSchema.publicId,
  name: Schema.optional(
    Schema.String.pipe(
      Schema.minLength(1, { message: () => "Season name is required" }),
      Schema.maxLength(60, {
        message: () => "Season name must be 60 characters or less",
      }),
      Schema.trimmed(),
    ),
  ),
  startDate: Schema.optional(DateSchema),
  endDate: Schema.optional(Schema.NullOr(DateSchema)),
  status: Schema.optional(Schema.Literal(...seasonStatusEnum.enumValues)),
  division: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class DeleteSeasonInput extends Schema.Class<DeleteSeasonInput>(
  "DeleteSeasonInput",
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
  publicId: PublicIdSchema.publicId,
}) {}
