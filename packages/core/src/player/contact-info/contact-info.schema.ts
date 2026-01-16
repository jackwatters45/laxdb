import { PublicIdSchema, PublicPlayerIdSchema } from "@laxdb/core/schema";
import { type Effect, Schema } from "effect";

import type { PlayerContactInfoService } from "./contact-info.service";

export class PlayerWithContactInfo extends Schema.Class<PlayerWithContactInfo>(
  "PlayerWithContactInfo",
)({
  ...PublicIdSchema,
  ...PublicPlayerIdSchema,
  name: Schema.String,
  email: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  facebook: Schema.NullOr(Schema.String),
  instagram: Schema.NullOr(Schema.String),
  whatsapp: Schema.NullOr(Schema.String),
  linkedin: Schema.NullOr(Schema.String),
  groupme: Schema.NullOr(Schema.String),
  emergencyContactName: Schema.NullOr(Schema.String),
  emergencyContactPhone: Schema.NullOr(Schema.String),
}) {}

export class GetPlayerContactInfoInput extends Schema.Class<GetPlayerContactInfoInput>(
  "GetPlayerContactInfoInput",
)({
  playerId: Schema.Number,
}) {}

// Return Types
type PlayerContactInfoServiceType = Effect.Effect.Success<
  typeof PlayerContactInfoService
>;

type PlayerWithContactInfoResult = Effect.Effect.Success<
  ReturnType<PlayerContactInfoServiceType["getPlayerWithContactInfo"]>
>;

export type PlayerWithContactInfoNonNullable =
  NonNullable<PlayerWithContactInfoResult>;
