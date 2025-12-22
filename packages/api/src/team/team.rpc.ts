import { Rpc, RpcGroup } from '@effect/rpc';
import { TeamContract } from '@laxdb/core/team/team.contract';
import { TeamService } from '@laxdb/core/team/team.service';
import { Effect, Layer } from 'effect';

export class TeamRpcs extends RpcGroup.make(
  Rpc.make('TeamCreate', {
    success: TeamContract.create.success,
    error: TeamContract.create.error,
    payload: TeamContract.create.payload,
  }),
  Rpc.make('TeamUpdate', {
    success: TeamContract.update.success,
    error: TeamContract.update.error,
    payload: TeamContract.update.payload,
  }),
  Rpc.make('TeamDelete', {
    success: TeamContract.delete.success,
    error: TeamContract.delete.error,
    payload: TeamContract.delete.payload,
  }),
  Rpc.make('TeamGetMembers', {
    success: TeamContract.getMembers.success,
    error: TeamContract.getMembers.error,
    payload: TeamContract.getMembers.payload,
  }),
  Rpc.make('TeamInvitePlayer', {
    success: TeamContract.invitePlayer.success,
    error: TeamContract.invitePlayer.error,
    payload: TeamContract.invitePlayer.payload,
  }),
  Rpc.make('TeamRemoveMember', {
    success: TeamContract.removeMember.success,
    error: TeamContract.removeMember.error,
    payload: TeamContract.removeMember.payload,
  })
) {}

export const TeamHandlers = TeamRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* TeamService;

    return {
      TeamCreate: (payload) => service.createTeam(payload, new Headers()),
      TeamUpdate: (payload) => service.updateTeam(payload, new Headers()),
      TeamDelete: (payload) => service.deleteTeam(payload, new Headers()),
      TeamGetMembers: (payload) =>
        service.getTeamMembers(payload, new Headers()),
      TeamInvitePlayer: (payload) =>
        service.invitePlayer(payload, new Headers()),
      TeamRemoveMember: (payload) =>
        service.removeTeamMember(payload, new Headers()),
    };
  })
).pipe(Layer.provide(TeamService.Default));
