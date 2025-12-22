import { AuthService } from '@laxdb/core/auth';
import { RuntimeServer } from '@laxdb/core/runtime.server';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { Organization } from 'better-auth/plugins';
import { Array as Arr, Effect } from 'effect';
import { authMiddleware } from '@/lib/middleware';

const getSessionAndOrg = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        let activeOrganization: Organization | undefined | null;

        activeOrganization = yield* Effect.promise(() =>
          auth.auth.api.getFullOrganization({
            headers: context.headers,
          })
        );

        if (!activeOrganization) {
          activeOrganization = yield* Effect.promise(() =>
            auth.auth.api.listOrganizations({
              headers: context.headers,
            })
          ).pipe(Effect.flatMap(Arr.head));
        }

        return {
          user: context.session.user,
          session: context.session.session,
          activeOrganization,
        };
      })
    )
  );

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const sessionAndOrg = await getSessionAndOrg();

    if (location.pathname === '/organizations/create') {
      return sessionAndOrg;
    }

    // If no organization at all, redirect to create one
    if (!sessionAndOrg.activeOrganization) {
      throw redirect({ to: '/organizations/create' });
    }

    return sessionAndOrg;
  },
});
