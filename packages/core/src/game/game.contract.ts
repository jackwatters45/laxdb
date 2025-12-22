import { Schema } from 'effect';
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../error';
import {
  CreateGameInput,
  DeleteGameInput,
  Game,
  GetAllGamesInput,
  GetGameInput,
  UpdateGameInput,
} from './game.schema';

export const GameErrors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError
);

export const GameContract = {
  list: {
    success: Schema.Array(Game),
    error: GameErrors,
    payload: GetAllGamesInput,
  },
  get: {
    success: Game,
    error: GameErrors,
    payload: GetGameInput,
  },
  create: {
    success: Game,
    error: GameErrors,
    payload: CreateGameInput,
  },
  update: {
    success: Game,
    error: GameErrors,
    payload: UpdateGameInput,
  },
  delete: {
    success: Game,
    error: GameErrors,
    payload: DeleteGameInput,
  },
} as const;
