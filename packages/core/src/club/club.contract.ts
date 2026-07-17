import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { Schema } from "effect";

import {
  AddRecipientInput,
  AddRosterPlayerInput,
  ClubOrganizationScopedInput,
  ClubTeam,
  CreateTeamInput,
  RecipientByIdInput,
  ReportRecipient,
  RosterPlayer,
  RosterPlayerByIdInput,
  TeamByIdInput,
  TeamScopedInput,
  UpdateRosterPlayerInput,
  UpdateTeamInput,
} from "./club.schema";

export const ClubErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

/** JSON request payloads — organizationId comes from the session, not the body. */
export const ClubApiPayload = {
  createTeam: Schema.Struct({
    name: Schema.String,
    coachMemberId: Schema.optional(Schema.NullOr(Schema.String)),
  }),
  updateTeam: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    coachMemberId: Schema.optional(Schema.NullOr(Schema.String)),
  }),
  byId: Schema.Struct({ id: Schema.String }),
  teamScoped: Schema.Struct({ teamId: Schema.String }),
  addRosterPlayer: Schema.Struct({
    teamId: Schema.String,
    name: Schema.String,
    jerseyNumber: Schema.optional(Schema.NullOr(Schema.Number)),
  }),
  updateRosterPlayer: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    jerseyNumber: Schema.optional(Schema.NullOr(Schema.Number)),
    active: Schema.optional(Schema.Boolean),
  }),
  addRecipient: Schema.Struct({
    teamId: Schema.optional(Schema.NullOr(Schema.String)),
    label: Schema.String,
    email: Schema.String,
  }),
} as const;

export const ClubContract = {
  listTeams: {
    success: Schema.Array(ClubTeam),
    error: ClubErrors,
    payload: ClubOrganizationScopedInput,
  },
  getTeam: {
    success: ClubTeam,
    error: ClubErrors,
    payload: TeamByIdInput,
  },
  createTeam: {
    success: ClubTeam,
    error: ClubErrors,
    payload: CreateTeamInput,
  },
  updateTeam: {
    success: ClubTeam,
    error: ClubErrors,
    payload: UpdateTeamInput,
  },
  deleteTeam: {
    success: ClubTeam,
    error: ClubErrors,
    payload: TeamByIdInput,
  },
  listRoster: {
    success: Schema.Array(RosterPlayer),
    error: ClubErrors,
    payload: TeamScopedInput,
  },
  addRosterPlayer: {
    success: RosterPlayer,
    error: ClubErrors,
    payload: AddRosterPlayerInput,
  },
  updateRosterPlayer: {
    success: RosterPlayer,
    error: ClubErrors,
    payload: UpdateRosterPlayerInput,
  },
  removeRosterPlayer: {
    success: RosterPlayer,
    error: ClubErrors,
    payload: RosterPlayerByIdInput,
  },
  listRecipients: {
    success: Schema.Array(ReportRecipient),
    error: ClubErrors,
    payload: ClubOrganizationScopedInput,
  },
  listRecipientsForTeam: {
    success: Schema.Array(ReportRecipient),
    error: ClubErrors,
    payload: TeamScopedInput,
  },
  addRecipient: {
    success: ReportRecipient,
    error: ClubErrors,
    payload: AddRecipientInput,
  },
  removeRecipient: {
    success: ReportRecipient,
    error: ClubErrors,
    payload: RecipientByIdInput,
  },
} as const;
