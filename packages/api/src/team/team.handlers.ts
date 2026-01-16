import { HttpApiBuilder } from "@effect/platform";
import { TeamService } from "@laxdb/core/team/team.service";
import { Effect, Layer } from "effect";
import { LaxdbApi } from "../definition";

// Handler implementation using LaxdbApi
export const TeamsGroupLive = HttpApiBuilder.group(
  LaxdbApi,
  "Teams",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* TeamService;

      return handlers
        .handle("createTeam", ({ payload }) =>
          service.createTeam(payload, new Headers()),
        )
        .handle("updateTeam", ({ payload }) =>
          service.updateTeam(payload, new Headers()),
        )
        .handle("deleteTeam", ({ payload }) =>
          service.deleteTeam(payload, new Headers()),
        )
        .handle("getMembers", ({ payload }) =>
          service.getTeamMembers(payload, new Headers()),
        )
        .handle("invitePlayer", ({ payload }) =>
          service.invitePlayer(payload, new Headers()),
        )
        .handle("removeMember", ({ payload }) =>
          service.removeTeamMember(payload, new Headers()),
        );
    }),
).pipe(Layer.provide(TeamService.Default));

// Legacy alias
export const TeamsApiLive = TeamsGroupLive;
