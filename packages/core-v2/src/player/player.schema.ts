import { Schema } from "effect";

import {
  EmailSchema,
  NanoidSchema,
  PlayerNameSchema,
  PublicIdSchema,
  TimestampsSchema,
} from "../schema";

export class Player extends Schema.Class<Player>("Player")({
  ...PublicIdSchema,
  name: Schema.String,
  email: EmailSchema,
  // username? for tagging
  ...TimestampsSchema,
}) {}

// Inputs

export class PlayerByIdInput extends Schema.Class<PlayerByIdInput>(
  "PlayerByIdInput",
)({
  publicId: NanoidSchema,
}) {}

export class CreatePlayerInput extends Schema.Class<CreatePlayerInput>(
  "CreatePlayerInput",
)({
  name: PlayerNameSchema,
  email: Schema.String,
}) {}

export class UpdatePlayerInput extends Schema.Class<UpdatePlayerInput>(
  "UpdatePlayerInput",
)({
  publicId: NanoidSchema,
  name: Schema.optional(PlayerNameSchema),
  email: Schema.optional(Schema.String),
}) {}
