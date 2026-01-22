import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  CanonicalPlayer,
  GetPlayerInput,
  PlayerSearchResult,
  SearchPlayersInput,
} from "./players.schema";

export const PlayersErrors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
);

export const PlayersContract = {
  getPlayer: {
    success: CanonicalPlayer,
    error: PlayersErrors,
    payload: GetPlayerInput,
  },
  searchPlayers: {
    success: Schema.Array(PlayerSearchResult),
    error: PlayersErrors,
    payload: SearchPlayersInput,
  },
} as const;
