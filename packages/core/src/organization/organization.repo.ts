import type { TeamMember } from 'better-auth/plugins';
import { Effect } from 'effect';
import { AuthService } from '../auth';
import {
  InvitationOperationError,
  OrganizationOperationError,
  OrganizationSlugError,
} from './organization.error';
import type { CreateOrganizationInput } from './organization.schema';

export class OrganizationRepo extends Effect.Service<OrganizationRepo>()(
  'OrganizationRepo',
  {
    effect: Effect.gen(function* () {
      const auth = yield* AuthService;

      return {
        checkOrganizationSlug: (slug: string) =>
          Effect.tryPromise(() =>
            auth.auth.api.checkOrganizationSlug({
              body: { slug },
            })
          ).pipe(
            Effect.tap(() => Effect.log('Slug is available')),
            Effect.tapError(Effect.logError),
            Effect.mapError(
              (cause) =>
                new OrganizationSlugError({
                  message: 'Organization slug is already taken',
                  slug,
                  cause,
                })
            )
          ),
        createOrganization: (headers: Headers, body: CreateOrganizationInput) =>
          Effect.tryPromise(() =>
            auth.auth.api.createOrganization({
              headers,
              body,
            })
          ).pipe(
            Effect.tap(() => Effect.log('Organization created')),
            Effect.tapError(Effect.logError),
            Effect.mapError(
              (cause) =>
                new OrganizationOperationError({
                  message: 'Failed to create organization',
                  cause,
                })
            ),
            Effect.filterOrFail(
              (org) => org !== null && org !== undefined,
              () =>
                new OrganizationOperationError({
                  message: 'Organization creation returned null',
                })
            )
          ),
        setActiveOrganization: (headers: Headers, organizationId: string) =>
          Effect.tryPromise(() =>
            auth.auth.api.setActiveOrganization({
              headers,
              body: { organizationId },
            })
          ).pipe(
            Effect.tap(() => Effect.log('Organization set as active')),
            Effect.tapError(Effect.logError),
            Effect.mapError(
              (cause) =>
                new OrganizationOperationError({
                  message: 'Failed to set organization as active',
                  organizationId,
                  cause,
                })
            )
          ),
        listOrganizationTeams: (headers: Headers, organizationId?: string) =>
          Effect.tryPromise(() =>
            auth.auth.api.listOrganizationTeams({
              headers,
              ...(organizationId ? { query: { organizationId } } : {}),
            })
          ).pipe(
            Effect.tap(() => Effect.log('Organization teams listed')),
            Effect.tapError(Effect.logError),
            Effect.mapError(
              (cause) =>
                new OrganizationOperationError({
                  message: 'Failed to list organization teams',
                  organizationId,
                  cause,
                })
            )
          ),
        acceptInvitation: (headers: Headers, invitationId: string) =>
          Effect.tryPromise(() =>
            auth.auth.api.acceptInvitation({
              headers,
              body: { invitationId },
            })
          ).pipe(
            Effect.mapError(
              (cause) =>
                new InvitationOperationError({
                  message: 'Failed to accept organization invitation',
                  invitationId,
                  cause,
                })
            )
          ),
        getTeamMembers: (headers: Headers, teamId: string) =>
          Effect.tryPromise(async () => {
            const teamMembers: TeamMember[] =
              await auth.auth.api.listTeamMembers({
                headers,
                query: { teamId },
              });

            return teamMembers;
          }).pipe(
            Effect.tap(() => Effect.log('Organization team members listed')),
            Effect.tapError(Effect.logError),
            Effect.mapError(
              (cause) =>
                new OrganizationOperationError({
                  message: 'Failed to retrieve team members',
                  cause,
                })
            )
          ),
      } as const;
    }),
    dependencies: [AuthService.Default],
  }
) {}
