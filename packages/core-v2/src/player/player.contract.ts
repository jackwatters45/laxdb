import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  CreatePlayerInput,
  Player,
  PlayerByIdInput,
  UpdatePlayerInput,
} from "./player.schema";

export const PlayerErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const PlayerContract = {
  list: {
    success: Schema.Array(Player),
    error: PlayerErrors,
    payload: Schema.Void,
  },
  get: {
    success: Player,
    error: PlayerErrors,
    payload: PlayerByIdInput,
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
    payload: PlayerByIdInput,
  },
} as const;
