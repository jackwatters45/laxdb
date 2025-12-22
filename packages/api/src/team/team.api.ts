import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from '@effect/platform';
import { TeamContract } from '@laxdb/core/team/team.contract';
import { TeamService } from '@laxdb/core/team/team.service';
import { Effect, Layer } from 'effect';

export const TeamsApi = HttpApi.make('TeamsApi').add(
  HttpApiGroup.make('Teams')
    .add(
      HttpApiEndpoint.post('createTeam', '/api/teams/create')
        .addSuccess(TeamContract.create.success)
        .addError(TeamContract.create.error)
        .setPayload(TeamContract.create.payload)
    )
    .add(
      HttpApiEndpoint.post('updateTeam', '/api/teams/update')
        .addSuccess(TeamContract.update.success)
        .addError(TeamContract.update.error)
        .setPayload(TeamContract.update.payload)
    )
    .add(
      HttpApiEndpoint.post('deleteTeam', '/api/teams/delete')
        .addSuccess(TeamContract.delete.success)
        .addError(TeamContract.delete.error)
        .setPayload(TeamContract.delete.payload)
    )
    .add(
      HttpApiEndpoint.post('getMembers', '/api/teams/members')
        .addSuccess(TeamContract.getMembers.success)
        .addError(TeamContract.getMembers.error)
        .setPayload(TeamContract.getMembers.payload)
    )
    .add(
      HttpApiEndpoint.post('invitePlayer', '/api/teams/invite-player')
        .addSuccess(TeamContract.invitePlayer.success)
        .addError(TeamContract.invitePlayer.error)
        .setPayload(TeamContract.invitePlayer.payload)
    )
    .add(
      HttpApiEndpoint.post('removeMember', '/api/teams/remove-member')
        .addSuccess(TeamContract.removeMember.success)
        .addError(TeamContract.removeMember.error)
        .setPayload(TeamContract.removeMember.payload)
    )
);

const TeamsApiHandlers = HttpApiBuilder.group(TeamsApi, 'Teams', (handlers) =>
  Effect.gen(function* () {
    const service = yield* TeamService;

    return handlers
      .handle('createTeam', ({ payload }) =>
        service.createTeam(payload, new Headers())
      )
      .handle('updateTeam', ({ payload }) =>
        service.updateTeam(payload, new Headers())
      )
      .handle('deleteTeam', ({ payload }) =>
        service.deleteTeam(payload, new Headers())
      )
      .handle('getMembers', ({ payload }) =>
        service.getTeamMembers(payload, new Headers())
      )
      .handle('invitePlayer', ({ payload }) =>
        service.invitePlayer(payload, new Headers())
      )
      .handle('removeMember', ({ payload }) =>
        service.removeTeamMember(payload, new Headers())
      );
  })
).pipe(Layer.provide(TeamService.Default));

export const TeamsApiLive = HttpApiBuilder.api(TeamsApi).pipe(
  Layer.provide(TeamsApiHandlers)
);
