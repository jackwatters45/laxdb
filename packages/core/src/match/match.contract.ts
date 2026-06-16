import { EmailDeliveryError } from "@laxdb/core/email/email.error";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { Schema } from "effect";

import {
  GamedayClub,
  GamedayCompetition,
  GamedayError,
  GamedaySeason,
  GamedayTeam,
  GamedayTeamCompetition,
} from "./gameday";
import {
  Fixture,
  FixtureByIdInput,
  ListFixturesInput,
  ListReportsInput,
  MatchReport,
  SubmitReportInput,
  SyncFixturesInput,
  SyncFixturesResult,
} from "./match.schema";

export const MatchErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
  GamedayError,
  EmailDeliveryError,
]);

/** JSON request payloads — organizationId comes from the session, not the body. */
export const MatchApiPayload = {
  listFixtures: Schema.Struct({
    teamId: Schema.optional(Schema.String),
  }),
  fixtureById: Schema.Struct({ id: Schema.String }),
  syncFixtures: Schema.Struct({ teamId: Schema.String }),
  listCompetitions: Schema.Struct({
    seasonId: Schema.optional(Schema.String),
  }),
  listGamedayTeams: Schema.Struct({
    compId: Schema.String,
  }),
  listGamedaySeasons: Schema.Struct({}),
  listGamedayClubs: Schema.Struct({
    seasonId: Schema.optional(Schema.String),
  }),
  listCompetitionsForClubs: Schema.Struct({
    clubNames: Schema.Array(Schema.String),
    seasonId: Schema.optional(Schema.String),
  }),
  listReports: Schema.Struct({
    teamId: Schema.optional(Schema.String),
  }),
  submitReport: Schema.Struct({
    fixtureId: Schema.String,
    topPlayer1Id: Schema.String,
    topPlayer2Id: Schema.optional(Schema.NullOr(Schema.String)),
    topPlayer3Id: Schema.optional(Schema.NullOr(Schema.String)),
    blurb: Schema.optional(Schema.NullOr(Schema.String)),
    recipientIds: Schema.Array(Schema.String),
  }),
} as const;

export const MatchContract = {
  listFixtures: {
    success: Schema.Array(Fixture),
    error: MatchErrors,
    payload: ListFixturesInput,
  },
  getFixture: {
    success: Fixture,
    error: MatchErrors,
    payload: FixtureByIdInput,
  },
  syncFixtures: {
    success: SyncFixturesResult,
    error: MatchErrors,
    payload: SyncFixturesInput,
  },
  listCompetitions: {
    success: Schema.Array(GamedayCompetition),
    error: MatchErrors,
    payload: MatchApiPayload.listCompetitions,
  },
  listGamedayTeams: {
    success: Schema.Array(GamedayTeam),
    error: MatchErrors,
    payload: MatchApiPayload.listGamedayTeams,
  },
  listGamedaySeasons: {
    success: Schema.Array(GamedaySeason),
    error: MatchErrors,
    payload: MatchApiPayload.listGamedaySeasons,
  },
  listGamedayClubs: {
    success: Schema.Array(GamedayClub),
    error: MatchErrors,
    payload: MatchApiPayload.listGamedayClubs,
  },
  listCompetitionsForClubs: {
    success: Schema.Array(GamedayTeamCompetition),
    error: MatchErrors,
    payload: MatchApiPayload.listCompetitionsForClubs,
  },
  listReports: {
    success: Schema.Array(MatchReport),
    error: MatchErrors,
    payload: ListReportsInput,
  },
  submitReport: {
    success: MatchReport,
    error: MatchErrors,
    payload: SubmitReportInput,
  },
} as const;
