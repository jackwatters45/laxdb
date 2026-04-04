import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  CreatePlayInput,
  DeletePlayInput,
  GetPlayInput,
  Play,
  UpdatePlayInput,
} from "./play.schema";

export const PlayErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const PlayContract = {
  list: {
    success: Schema.Array(Play),
    error: PlayErrors,
    payload: Schema.NullOr(Schema.Void),
  },
  get: {
    success: Play,
    error: PlayErrors,
    payload: GetPlayInput,
  },
  create: {
    success: Play,
    error: PlayErrors,
    payload: CreatePlayInput,
  },
  update: {
    success: Play,
    error: PlayErrors,
    payload: UpdatePlayInput,
  },
  delete: {
    success: Play,
    error: PlayErrors,
    payload: DeletePlayInput,
  },
} as const;
