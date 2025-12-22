import { type Effect, Schema } from 'effect';
import {
  JerseyNumberSchema as BaseJerseyNumberSchema,
  EmailSchema,
  NullablePlayerNameSchema,
  OrganizationIdSchema,
  PlayerNameSchema,
  PublicIdSchema,
  PublicPlayerIdSchema,
  TeamIdSchema,
  TimestampsSchema,
} from '../schema';
import type { PlayerService } from './player.service';

export const JerseyNumberSchema = Schema.NullOr(BaseJerseyNumberSchema);

export const PositionSchema = Schema.NullOr(Schema.String);

export class Player extends Schema.Class<Player>('Player')({
  ...PublicIdSchema,
  ...OrganizationIdSchema,
  userId: Schema.NullOr(Schema.String),
  name: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  dateOfBirth: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class TeamPlayer extends Schema.Class<TeamPlayer>('TeamPlayer')({
  ...PublicIdSchema,
  ...OrganizationIdSchema,
  userId: Schema.NullOr(Schema.String),
  name: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  dateOfBirth: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
  teamId: Schema.String,
  jerseyNumber: Schema.NullOr(Schema.Number),
  position: Schema.NullOr(Schema.String),
}) {}

export class GetAllPlayersInput extends Schema.Class<GetAllPlayersInput>(
  'GetAllPlayersInput'
)({
  ...OrganizationIdSchema,
}) {}

export class CreatePlayerInput extends Schema.Class<CreatePlayerInput>(
  'CreatePlayerInput'
)({
  ...OrganizationIdSchema,
  name: PlayerNameSchema,
  email: Schema.NullOr(EmailSchema),
  phone: Schema.NullOr(Schema.String),
  dateOfBirth: Schema.NullOr(Schema.String),
  userId: Schema.NullOr(Schema.String),
}) {}

export class GetTeamPlayersInput extends Schema.Class<GetTeamPlayersInput>(
  'GetTeamPlayersInput'
)({
  ...TeamIdSchema,
}) {}

export class UpdatePlayerInput extends Schema.Class<UpdatePlayerInput>(
  'UpdatePlayerInput'
)({
  ...PublicPlayerIdSchema,
  name: Schema.optional(NullablePlayerNameSchema),
  email: Schema.optional(Schema.NullOr(EmailSchema)),
  phone: Schema.optional(Schema.NullOr(Schema.String)),
  dateOfBirth: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class UpdateTeamPlayerInput extends Schema.Class<UpdateTeamPlayerInput>(
  'UpdateTeamPlayerInput'
)({
  ...TeamIdSchema,
  ...PublicPlayerIdSchema,
  jerseyNumber: Schema.optional(JerseyNumberSchema),
  position: Schema.optional(PositionSchema),
}) {}

export class AddNewPlayerToTeamInput extends Schema.Class<AddNewPlayerToTeamInput>(
  'AddNewPlayerToTeamInput'
)({
  ...TeamIdSchema,
  jerseyNumber: JerseyNumberSchema,
  position: PositionSchema,
}) {}

export class AddPlayerToTeamInput extends Schema.Class<AddPlayerToTeamInput>(
  'AddPlayerToTeamInput'
)({
  ...PublicPlayerIdSchema,
  ...TeamIdSchema,
  jerseyNumber: JerseyNumberSchema,
  position: PositionSchema,
}) {}

export class RemovePlayerFromTeamInput extends Schema.Class<RemovePlayerFromTeamInput>(
  'RemovePlayerFromTeamInput'
)({
  teamId: Schema.String,
  playerId: Schema.String,
}) {}

export class DeletePlayerInput extends Schema.Class<DeletePlayerInput>(
  'DeletePlayerInput'
)({
  playerId: Schema.String,
}) {}

export class BulkRemovePlayersFromTeamInput extends Schema.Class<BulkRemovePlayersFromTeamInput>(
  'BulkRemovePlayersFromTeamInput'
)({
  teamId: Schema.String,
  playerIds: Schema.Array(Schema.String),
}) {}

export class BulkDeletePlayersInput extends Schema.Class<BulkDeletePlayersInput>(
  'BulkDeletePlayersInput'
)({
  playerIds: Schema.Array(Schema.String),
}) {}

// Return Types
type PlayerServiceType = Effect.Effect.Success<typeof PlayerService>;

type TeamPlayersResult = Effect.Effect.Success<
  ReturnType<PlayerServiceType['getTeamPlayers']>
>;

export type TeamPlayerWithInfo = TeamPlayersResult[number];
