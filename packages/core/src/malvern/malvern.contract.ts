import { Schema } from "effect";

import {
  AuthenticationError,
  AuthorizationError,
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  AssignMalvernCoachInput,
  CreateMalvernPlayerInput,
  CreateMalvernTeamInput,
  FixtureImportResult,
  ListMalvernTeamsInput,
  ListTopThreeSubmissionsInput,
  MalvernFixture,
  MalvernPlayer,
  MalvernTeam,
  MalvernTeamCoach,
  MalvernTopThreeSubmission,
  SubmitTopThreeInput,
  SyncMalvernFixturesInput,
  TeamScopedInput,
  UpdateMalvernPlayerInput,
  UpdateMalvernTeamInput,
} from "./malvern.schema";

export const MalvernErrors = Schema.Union([
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const MalvernApiPayload = {
  listTeams: Schema.Struct({}),
  teamScoped: Schema.Struct({ teamPublicId: Schema.String }),
  createTeam: Schema.Struct({
    name: Schema.String,
    grade: Schema.optional(Schema.NullOr(Schema.String)),
    sourceUrl: Schema.optional(Schema.NullOr(Schema.String)),
    defaultRecipientEmails: Schema.optional(Schema.Array(Schema.String)),
  }),
  updateTeam: Schema.Struct({
    teamPublicId: Schema.String,
    name: Schema.optional(Schema.String),
    grade: Schema.optional(Schema.NullOr(Schema.String)),
    sourceUrl: Schema.optional(Schema.NullOr(Schema.String)),
    defaultRecipientEmails: Schema.optional(Schema.Array(Schema.String)),
  }),
  assignCoach: Schema.Struct({
    teamPublicId: Schema.String,
    coachUserId: Schema.String,
  }),
  createPlayer: Schema.Struct({
    teamPublicId: Schema.String,
    name: Schema.String,
    jumperNumber: Schema.optional(Schema.NullOr(Schema.Number)),
  }),
  updatePlayer: Schema.Struct({
    publicId: Schema.String,
    name: Schema.optional(Schema.String),
    jumperNumber: Schema.optional(Schema.NullOr(Schema.Number)),
    active: Schema.optional(Schema.Boolean),
  }),
  syncFixtures: Schema.Struct({
    teamPublicId: Schema.String,
    sourceUrl: Schema.optional(Schema.NullOr(Schema.String)),
  }),
  submitTopThree: Schema.Struct({
    fixturePublicId: Schema.String,
    firstPlayerPublicId: Schema.String,
    secondPlayerPublicId: Schema.String,
    thirdPlayerPublicId: Schema.String,
    blurb: Schema.optional(Schema.NullOr(Schema.String)),
    recipientEmails: Schema.Array(Schema.String),
  }),
  listSubmissions: Schema.Struct({
    teamPublicId: Schema.optional(Schema.String),
  }),
} as const;

export const MalvernContract = {
  listTeams: {
    success: Schema.Array(MalvernTeam),
    error: MalvernErrors,
    payload: ListMalvernTeamsInput,
  },
  getTeam: {
    success: MalvernTeam,
    error: MalvernErrors,
    payload: TeamScopedInput,
  },
  createTeam: {
    success: MalvernTeam,
    error: MalvernErrors,
    payload: CreateMalvernTeamInput,
  },
  updateTeam: {
    success: MalvernTeam,
    error: MalvernErrors,
    payload: UpdateMalvernTeamInput,
  },
  assignCoach: {
    success: MalvernTeamCoach,
    error: MalvernErrors,
    payload: AssignMalvernCoachInput,
  },
  listCoaches: {
    success: Schema.Array(MalvernTeamCoach),
    error: MalvernErrors,
    payload: TeamScopedInput,
  },
  listPlayers: {
    success: Schema.Array(MalvernPlayer),
    error: MalvernErrors,
    payload: TeamScopedInput,
  },
  createPlayer: {
    success: MalvernPlayer,
    error: MalvernErrors,
    payload: CreateMalvernPlayerInput,
  },
  updatePlayer: {
    success: MalvernPlayer,
    error: MalvernErrors,
    payload: UpdateMalvernPlayerInput,
  },
  listFixtures: {
    success: Schema.Array(MalvernFixture),
    error: MalvernErrors,
    payload: TeamScopedInput,
  },
  importFixtures: {
    success: FixtureImportResult,
    error: MalvernErrors,
    payload: SyncMalvernFixturesInput,
  },
  submitTopThree: {
    success: MalvernTopThreeSubmission,
    error: MalvernErrors,
    payload: SubmitTopThreeInput,
  },
  listSubmissions: {
    success: Schema.Array(MalvernTopThreeSubmission),
    error: MalvernErrors,
    payload: ListTopThreeSubmissionsInput,
  },
} as const;
