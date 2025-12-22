import { Effect } from 'effect';
import { AuthService } from '../auth';
import {
  TeamMemberError,
  TeamNotFoundError,
  TeamOperationError,
} from './team.error';
import type {
  CreateTeamInput,
  DeleteTeamInput,
  InvitePlayerInput,
  RemoveTeamMemberInput,
  UpdateTeamInput,
} from './team.schema';

export class TeamRepo extends Effect.Service<TeamRepo>()('TeamRepo', {
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;

    return {
      create: (
        headers: Headers,
        decoded: CreateTeamInput,
        activeOrganizationId: string
      ) =>
        Effect.tryPromise(() =>
          auth.auth.api.createTeam({
            headers,
            body: {
              name: decoded.name,
              organizationId: activeOrganizationId,
            },
          })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new TeamOperationError({
                message: 'Failed to create team in organization',
                cause,
              })
          )
        ),
      update: (headers: Headers, validated: UpdateTeamInput) =>
        Effect.tryPromise(() =>
          auth.auth.api.updateTeam({
            headers,
            body: {
              teamId: validated.teamId,
              data: {
                name: validated.name,
              },
            },
          })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new TeamOperationError({
                message: 'Failed to update team details',
                teamId: validated.teamId,
                cause,
              })
          ),
          Effect.filterOrFail(
            (team) => !!team,
            () =>
              new TeamNotFoundError({
                message: 'Team not found or update returned null',
                teamId: validated.teamId,
              })
          )
        ),
      delete: (headers: Headers, decoded: DeleteTeamInput) =>
        Effect.tryPromise(() =>
          auth.auth.api.removeTeam({
            headers,
            body: {
              teamId: decoded.teamId,
            },
          })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new TeamOperationError({
                message: 'Failed to delete team',
                teamId: decoded.teamId,
                cause,
              })
          )
        ),
      invite: (body: InvitePlayerInput, headers: Headers) =>
        Effect.tryPromise(() =>
          auth.auth.api.createInvitation({ body, headers })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new TeamMemberError({
                message: 'Failed to create player invitation',
                teamId: body.teamId,
                cause,
              })
          )
        ),
      removeMember: (decoded: RemoveTeamMemberInput, headers: Headers) =>
        Effect.tryPromise(() =>
          auth.auth.api.removeTeamMember({
            body: {
              teamId: decoded.teamId,
              userId: decoded.userId,
            },
            headers,
          })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new TeamMemberError({
                message: 'Failed to remove member from team',
                teamId: decoded.teamId,
                userId: decoded.userId,
                cause,
              })
          )
        ),
    } as const;
  }),
  dependencies: [AuthService.Default],
}) {}
