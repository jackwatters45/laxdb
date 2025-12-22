import { Schema } from 'effect';
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../error';
import {
  CreateSeasonInput,
  DeleteSeasonInput,
  GetAllSeasonsInput,
  GetSeasonInput,
  Season,
  UpdateSeasonInput,
} from './season.schema';

export const SeasonErrors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError
);

export const SeasonContract = {
  list: {
    success: Schema.Array(Season),
    error: SeasonErrors,
    payload: GetAllSeasonsInput,
  },
  get: {
    success: Season,
    error: SeasonErrors,
    payload: GetSeasonInput,
  },
  create: {
    success: Season,
    error: SeasonErrors,
    payload: CreateSeasonInput,
  },
  update: {
    success: Season,
    error: SeasonErrors,
    payload: UpdateSeasonInput,
  },
  delete: {
    success: Season,
    error: SeasonErrors,
    payload: DeleteSeasonInput,
  },
} as const;
