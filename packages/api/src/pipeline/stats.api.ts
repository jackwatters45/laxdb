import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { StatsContract } from "@laxdb/core/pipeline/stats.contract";

// Stats API group - public endpoints (no auth)
export const StatsApiGroup = HttpApiGroup.make("Stats")
  .add(
    HttpApiEndpoint.post("getLeaderboard", "/api/stats/leaderboard")
      .addSuccess(StatsContract.getLeaderboard.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(StatsContract.getLeaderboard.payload),
  )
  .add(
    HttpApiEndpoint.post("getPlayerStats", "/api/stats/player")
      .addSuccess(StatsContract.getPlayerStats.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(StatsContract.getPlayerStats.payload),
  )
  .add(
    HttpApiEndpoint.post("getTeamStats", "/api/stats/team")
      .addSuccess(StatsContract.getTeamStats.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(StatsContract.getTeamStats.payload),
  );
