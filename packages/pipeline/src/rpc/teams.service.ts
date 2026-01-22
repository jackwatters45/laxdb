import { NotFoundError } from "@laxdb/core/error";
import type {
  GetTeamInput,
  GetTeamsInput,
} from "@laxdb/core/pipeline/teams.schema";
import { parsePostgresError } from "@laxdb/core/util";
import { Effect } from "effect";

import { TeamsRepo } from "./teams.repo";

export class TeamsService extends Effect.Service<TeamsService>()(
  "TeamsService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* TeamsRepo;

      return {
        getTeam: (input: GetTeamInput) =>
          Effect.gen(function* () {
            const team = yield* repo.getTeam(input);
            if (team === null) {
              return yield* Effect.fail(
                new NotFoundError({
                  domain: "Team",
                  id: input.teamId,
                  message: `Team not found: ${input.teamId}`,
                }),
              );
            }
            return team;
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap((team) => Effect.log(`Fetched team: ${team.name}`)),
            Effect.tapError((error) =>
              Effect.logError(`Failed to fetch team: ${error._tag}`),
            ),
          ),

        getTeams: (input: GetTeamsInput) =>
          Effect.gen(function* () {
            return yield* repo.getTeams(input);
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap((results) =>
              Effect.log(
                `Fetched ${results.length} teams${input.leagues ? ` for leagues: ${input.leagues.join(", ")}` : ""}`,
              ),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to fetch teams: ${error._tag}`),
            ),
          ),
      } as const;
    }),
    dependencies: [TeamsRepo.Default],
  },
) {}
