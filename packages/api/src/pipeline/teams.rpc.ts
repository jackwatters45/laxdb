import { Rpc, RpcGroup } from "@effect/rpc";
import { TeamsContract } from "@laxdb/core/pipeline/teams.contract";
import { TeamsService } from "@laxdb/pipeline/rpc/teams.service";
import { Effect, Layer } from "effect";

export class TeamsRpcs extends RpcGroup.make(
  Rpc.make("TeamsGetTeam", {
    success: TeamsContract.getTeam.success,
    error: TeamsContract.getTeam.error,
    payload: TeamsContract.getTeam.payload,
  }),
  Rpc.make("TeamsGetTeams", {
    success: TeamsContract.getTeams.success,
    error: TeamsContract.getTeams.error,
    payload: TeamsContract.getTeams.payload,
  }),
) {}

export const TeamsHandlers = TeamsRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* TeamsService;

    return {
      TeamsGetTeam: (payload) => service.getTeam(payload),
      TeamsGetTeams: (payload) => service.getTeams(payload),
    };
  }),
).pipe(Layer.provide(TeamsService.Default));
