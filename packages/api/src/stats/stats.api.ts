import {
  AuthenticationError,
  AuthorizationError,
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import {
  StatsApiPayload,
  StatsContract,
} from "@laxdb/core/stats/stats.contract";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from "effect/unstable/httpapi";

const StatsErrors = [
  AuthenticationError.pipe(HttpApiSchema.status(401)),
  AuthorizationError.pipe(HttpApiSchema.status(403)),
  NotFoundError.pipe(HttpApiSchema.status(404)),
  ValidationError.pipe(HttpApiSchema.status(400)),
  DatabaseError.pipe(HttpApiSchema.status(500)),
  ConstraintViolationError.pipe(HttpApiSchema.status(409)),
] as const;

const getFixtureStats = HttpApiEndpoint.post(
  "getFixtureStats",
  "/api/stats/fixture/get",
  {
    success: StatsContract.getFixture.success,
    error: StatsErrors,
    payload: StatsApiPayload.fixture,
  },
);

const upsertFixtureStats = HttpApiEndpoint.post(
  "upsertFixtureStats",
  "/api/stats/fixture/upsert",
  {
    success: StatsContract.upsertFixture.success,
    error: StatsErrors,
    payload: StatsApiPayload.upsertFixture,
  },
);

const getTeamSummary = HttpApiEndpoint.post(
  "getTeamSummary",
  "/api/stats/team/summary",
  {
    success: StatsContract.getTeamSummary.success,
    error: StatsErrors,
    payload: StatsApiPayload.teamSeason,
  },
);

const getTeamPlayerStats = HttpApiEndpoint.post(
  "getTeamPlayerStats",
  "/api/stats/team/players",
  {
    success: StatsContract.getTeamPlayerStats.success,
    error: StatsErrors,
    payload: StatsApiPayload.teamSeason,
  },
);

const getTeamStandings = HttpApiEndpoint.post(
  "getTeamStandings",
  "/api/stats/team/standings",
  {
    success: StatsContract.getTeamStandings.success,
    error: StatsErrors,
    payload: StatsApiPayload.teamSeason,
  },
);

export const StatsGroup = HttpApiGroup.make("Stats")
  .add(getFixtureStats)
  .add(upsertFixtureStats)
  .add(getTeamSummary)
  .add(getTeamPlayerStats)
  .add(getTeamStandings);
