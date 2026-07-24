import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { Schema } from "effect";

import {
  FixtureStatSheet,
  TeamPlayerStats,
  TeamSeasonSummary,
  TeamStandings,
  UpsertFixturePlayerStatInput,
} from "./stats.schema";

export const StatsErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const StatsApiPayload = {
  fixture: Schema.Struct({ fixtureId: Schema.String }),
  teamSeason: Schema.Struct({
    teamId: Schema.String,
    seasonId: Schema.optional(Schema.String),
  }),
  upsertFixture: Schema.Struct({
    fixtureId: Schema.String,
    goalsForOverride: Schema.NullOr(Schema.Number),
    goalsAgainstOverride: Schema.NullOr(Schema.Number),
    assistedGoals: Schema.Number,
    shots: Schema.NullOr(Schema.Number),
    saves: Schema.NullOr(Schema.Number),
    players: Schema.Array(UpsertFixturePlayerStatInput),
  }),
} as const;

export const StatsContract = {
  getFixture: {
    success: FixtureStatSheet,
    error: StatsErrors,
  },
  upsertFixture: {
    success: FixtureStatSheet,
    error: StatsErrors,
  },
  getTeamSummary: {
    success: TeamSeasonSummary,
    error: StatsErrors,
  },
  getTeamPlayerStats: {
    success: TeamPlayerStats,
    error: StatsErrors,
  },
  getTeamStandings: {
    success: TeamStandings,
    error: StatsErrors,
  },
} as const;
