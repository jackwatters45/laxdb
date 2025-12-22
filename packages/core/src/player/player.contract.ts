import { Schema } from 'effect';
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../error';
import {
  AddPlayerToTeamInput,
  BulkDeletePlayersInput,
  BulkRemovePlayersFromTeamInput,
  CreatePlayerInput,
  DeletePlayerInput,
  GetAllPlayersInput,
  GetTeamPlayersInput,
  Player,
  RemovePlayerFromTeamInput,
  TeamPlayer,
  UpdatePlayerInput,
  UpdateTeamPlayerInput,
} from './player.schema';

export const PlayerErrors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError
);

export const PlayerContract = {
  list: {
    success: Schema.Array(Player),
    error: PlayerErrors,
    payload: GetAllPlayersInput,
  },
  create: {
    success: Player,
    error: PlayerErrors,
    payload: CreatePlayerInput,
  },
  update: {
    success: Player,
    error: PlayerErrors,
    payload: UpdatePlayerInput,
  },
  delete: {
    success: Player,
    error: PlayerErrors,
    payload: DeletePlayerInput,
  },
  bulkDelete: {
    success: Schema.Void,
    error: PlayerErrors,
    payload: BulkDeletePlayersInput,
  },
  getTeamPlayers: {
    success: Schema.Array(TeamPlayer),
    error: PlayerErrors,
    payload: GetTeamPlayersInput,
  },
  addPlayerToTeam: {
    success: Schema.Any,
    error: PlayerErrors,
    payload: AddPlayerToTeamInput,
  },
  updateTeamPlayer: {
    success: Schema.Any,
    error: PlayerErrors,
    payload: UpdateTeamPlayerInput,
  },
  removePlayerFromTeam: {
    success: Schema.Void,
    error: PlayerErrors,
    payload: RemovePlayerFromTeamInput,
  },
  bulkRemovePlayersFromTeam: {
    success: Schema.Void,
    error: PlayerErrors,
    payload: BulkRemovePlayersFromTeamInput,
  },
} as const;
