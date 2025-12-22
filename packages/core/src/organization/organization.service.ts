import type { Member } from 'better-auth/plugins/organization';
import { Array as Arr, Effect, Option, Schema } from 'effect';
import { AuthService } from '../auth';
import { NotFoundError } from '../error';
import { OrganizationNotFoundError } from './organization.error';
import { OrganizationRepo } from './organization.repo';
import {
  AcceptInvitationInput,
  CreateOrganizationInput,
  type DashboardData,
} from './organization.schema';

export class OrganizationService extends Effect.Service<OrganizationService>()(
  'OrganizationService',
  {
    effect: Effect.gen(function* () {
      const auth = yield* AuthService;
      const repo = yield* OrganizationRepo;

      return {
        createOrganization: (
          input: CreateOrganizationInput,
          headers: Headers
        ) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(CreateOrganizationInput)(
              input
            );

            yield* repo.checkOrganizationSlug(validated.slug);

            const org = yield* repo.createOrganization(headers, validated);

            yield* repo.setActiveOrganization(headers, org.id);

            const team = yield* repo
              .listOrganizationTeams(headers, org.id)
              .pipe(
                Effect.flatMap((teams) =>
                  Option.match(
                    Arr.findFirst(
                      teams,
                      (team) => team.name === validated.name
                    ),
                    {
                      onNone: () =>
                        Effect.fail(
                          new NotFoundError({
                            domain: 'organization',
                            id: org.id,
                            message: 'Team not found',
                          })
                        ),
                      onSome: Effect.succeed,
                    }
                  )
                )
              );

            return { teamId: team.id };
          }),

        acceptInvitation: (input: AcceptInvitationInput, headers: Headers) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(AcceptInvitationInput)(
              input
            );

            return yield* repo.acceptInvitation(
              headers,
              validated.invitationId
            );
          }),

        getUserOrganizationContext: (headers: Headers) =>
          Effect.gen(function* () {
            yield* auth.getSessionOrThrow(headers);

            const [activeOrganization, teams] = yield* Effect.all(
              [
                auth.getActiveOrganization(headers),
                repo.listOrganizationTeams(headers),
              ],
              { concurrency: 'unbounded' }
            ).pipe(
              Effect.flatMap(([org, teams]) =>
                org
                  ? Effect.succeed([org, teams] as const)
                  : Effect.fail(
                      new OrganizationNotFoundError({
                        message: 'User has no active organization',
                      })
                    )
              )
            );

            const teamsWithMembers = yield* Effect.all(
              teams.map((team) =>
                repo
                  .getTeamMembers(headers, team.id)
                  .pipe(Effect.map((members) => ({ ...team, members })))
              ),
              { concurrency: 'unbounded' }
            );

            // Better Auth doesn't expose listTeams or getActiveMember APIs yet
            // So we'll implement basic functionality for now and enhance later
            const activeMember: Member | null = null;

            // Assume users who have an organization can manage teams for now
            // This will be refined when Better Auth exposes more granular member APIs
            const canManageTeams = true;

            return {
              activeOrganization,
              teams: teamsWithMembers,
              activeMember,
              canManageTeams,
            } satisfies DashboardData;
          }),
      } as const;
    }),
    dependencies: [OrganizationRepo.Default, AuthService.Default],
  }
) {}
