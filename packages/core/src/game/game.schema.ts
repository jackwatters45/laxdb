import { Schema } from 'effect';
import {
  NullableTeamIdSchema,
  OrganizationIdSchema,
  PublicIdSchema,
  TeamIdSchema,
  TimestampsSchema,
} from '../schema';

export class Game extends Schema.Class<Game>('Game')({
  ...PublicIdSchema,
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  seasonId: Schema.Number,
  opponentName: Schema.String,
  gameDate: Schema.DateFromSelf,
  venue: Schema.String,
  isHomeGame: Schema.Boolean,
  gameType: Schema.String,
  status: Schema.String,
  ...TimestampsSchema,
}) {}

export const Games = Schema.Array(Game);

export class GetAllGamesInput extends Schema.Class<GetAllGamesInput>(
  'GetAllGamesInput'
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
}) {}

export class GetGameInput extends Schema.Class<GetGameInput>('GetGameInput')({
  ...PublicIdSchema,
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
}) {}

export class CreateGameInput extends Schema.Class<CreateGameInput>(
  'CreateGameInput'
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  seasonId: Schema.Number.pipe(Schema.int()),
  opponentName: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(100)),
  gameDate: Schema.DateFromSelf,
  venue: Schema.String,
  isHomeGame: Schema.Boolean,
  gameType: Schema.optional(Schema.String),
  status: Schema.optional(Schema.String),
}) {}

export class UpdateGameInput extends Schema.Class<UpdateGameInput>(
  'UpdateGameInput'
)({
  ...PublicIdSchema,
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  opponentName: Schema.optional(
    Schema.String.pipe(Schema.minLength(2), Schema.maxLength(100))
  ),
  gameDate: Schema.optional(Schema.DateFromSelf),
  venue: Schema.optional(Schema.String),
  isHomeGame: Schema.optional(Schema.Boolean),
  gameType: Schema.optional(Schema.String),
  status: Schema.optional(Schema.String),
  homeScore: Schema.optional(Schema.Number.pipe(Schema.int())),
  awayScore: Schema.optional(Schema.Number.pipe(Schema.int())),
  notes: Schema.optional(Schema.String),
  location: Schema.optional(Schema.String),
  uniformColor: Schema.optional(Schema.String),
  arrivalTime: Schema.optional(Schema.DateFromSelf),
  opponentLogoUrl: Schema.optional(Schema.String),
  externalGameId: Schema.optional(Schema.String),
}) {}

export class DeleteGameInput extends Schema.Class<DeleteGameInput>(
  'DeleteGameInput'
)({
  ...PublicIdSchema,
  ...OrganizationIdSchema,
  ...TeamIdSchema,
}) {}
