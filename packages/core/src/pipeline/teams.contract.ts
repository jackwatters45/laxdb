import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  GetTeamInput,
  GetTeamsInput,
  TeamDetails,
  TeamWithRoster,
} from "./teams.schema";

export const TeamsErrors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
);

export const TeamsContract = {
  getTeam: {
    success: TeamWithRoster,
    error: TeamsErrors,
    payload: GetTeamInput,
  },
  getTeams: {
    success: Schema.Array(TeamDetails),
    error: TeamsErrors,
    payload: GetTeamsInput,
  },
} as const;
