import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth, type Session, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  lastLoginMethod,
  openAPI,
  organization,
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { desc, eq } from "drizzle-orm";
import { Array as Arr, Effect, ManagedRuntime } from "effect";
import { OrganizationMembershipError } from "./auth/auth.error";
import {
  ac,
  assistantCoach,
  coach,
  headCoach,
  parent,
  player,
} from "./auth/auth.permissions";
import * as authSchema from "./auth/auth.sql";
import { DatabaseLive } from "./drizzle/drizzle.service";
import { AuthenticationError, DatabaseError } from "./error";
import {
  invitationTable,
  memberTable,
  organizationTable,
} from "./organization/organization.sql";
import { teamMemberTable, teamTable } from "./team/team.sql";
import { userTable } from "./user/user.sql";
import type { Headers } from "./type";

const polarClient = new Polar({
  // accessToken: Resource.PolarAccessToken.value,
  // server: Resource.Stage.value === 'production' ? 'production' : 'sandbox',
});

const runtime = ManagedRuntime.make(DatabaseLive);

export class AuthService extends Effect.Service<AuthService>()("AuthService", {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const auth = betterAuth({
      appName: "Goalbound",
      secret: process.env.BETTER_AUTH_SECRET!,
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
          user: userTable,
          session: authSchema.sessionTable,
          account: authSchema.accountTable,
          verification: authSchema.verificationTable,
          organization: organizationTable,
          member: memberTable,
          invitation: invitationTable,
          team: teamTable,
          teamMember: teamMemberTable,
          // subscription: authSchema.subscriptionTable,
        },
      }),
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
      // FIX: Wire up KVService for rate limiting and session caching
      // See packages/core/src/kv.ts - need to inject KVNamespace binding from worker env
      // rateLimit: { window: 10, max: 100, storage: 'secondary-storage' },
      // secondaryStorage: { get, set, delete }
      session: {
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60, // Cache duration in seconds
        },
      },
      user: {
        deleteUser: {
          enabled: true,
          afterDelete: async (_user, _request) => {
            // await polar.customers.deleteExternal({
            //   externalId: user.id,
            // });
          },
        },
      },
      databaseHooks: {
        session: {
          create: {
            before: async (session) => {
              const effect = Effect.gen(function* () {
                const sessionFromDb = yield* db
                  .select({
                    activeOrganizationId:
                      authSchema.sessionTable.activeOrganizationId,
                  })
                  .from(authSchema.sessionTable)
                  .where(eq(authSchema.sessionTable.userId, session.userId))
                  .limit(1)
                  .pipe(
                    Effect.flatMap(Arr.head),
                    Effect.tapError(Effect.logError),
                    Effect.mapError(
                      (cause) =>
                        new DatabaseError({
                          message:
                            "Failed to retrieve existing session from database",
                          cause,
                        }),
                    ),
                  );

                if (sessionFromDb?.activeOrganizationId) {
                  return sessionFromDb?.activeOrganizationId;
                }

                const membership = yield* db
                  .select({ organizationId: memberTable.organizationId })
                  .from(memberTable)
                  .where(eq(memberTable.userId, session.userId))
                  .orderBy(desc(memberTable.createdAt))
                  .limit(1)
                  .pipe(
                    Effect.flatMap(Arr.head),
                    Effect.tapError(Effect.logError),
                    Effect.mapError(
                      (cause) =>
                        new OrganizationMembershipError({
                          message:
                            "Failed to retrieve user organization membership",
                          cause,
                        }),
                    ),
                  );

                if (!membership) {
                  return null;
                }

                return membership.organizationId;
              });

              const organizationId = await runtime.runPromise(effect);
              return {
                data: {
                  ...session,
                  activeOrganizationId: organizationId,
                },
              };
            },
          },
        },
      },
      plugins: [
        polar({
          client: polarClient,
          createCustomerOnSignUp: true,
          // oxlint-disable-next-line require-await
          getCustomerCreateParams: async ({ user: _user }, _request) => ({
            metadata: {
              myCustomProperty: "123",
            },
          }),
          use: [
            checkout({
              products: [
                {
                  productId: "9c95ece8-1776-4629-a58a-26f8b46b59b4",
                  slug: "teams",
                },
              ],
              successUrl: "/success?checkout_id={CHECKOUT_ID}",
              authenticatedUsersOnly: true,
            }),
            portal(),
            usage(),
            webhooks({
              secret: process.env.POLAR_WEBHOOK_SECRET!,
              // onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
              // onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
              // ...  // Over 25 granular webhook handlers
              // onPayload: (payload) => // Catch-all for all events
            }),
          ],
        }),
        admin(),
        organization({
          ac,
          roles: {
            headCoach,
            coach,
            assistantCoach,
            player,
            parent,
          },
          teams: { enabled: true },
          creatorRole: "headCoach", // Club creator becomes head coach
          allowUserToCreateOrganization: true, // Allow creating new clubs
          // oxlint-disable-next-line require-await
          sendInvitationEmail: async (data) => {
            const _inviteLink = `${process.env.APP_URL ?? "http://localhost:3000"}/accept-invitation/${data.id}`;

            // FIX: Implement actual email sending
            // await sendEmail({
            //   to: data.email,
            //   subject: `Join ${data.organization.name} on LaxDB`,
            //   template: "player-invitation",
            //   data: {
            //     inviteLink,
            //     clubName: data.organization.name,
            //     role: data.role,
            //     teamName: data.teamId ? await getTeamName(data.teamId) : null,
            //   },
            // });
          },
        }),
        openAPI(),
        lastLoginMethod(),
        tanstackStartCookies(), // make sure this is the last plugin in the array
      ],
    });

    return {
      auth, // export base auth
      getSession: (headers: Headers) =>
        Effect.tryPromise(async () => {
          const session: { session: Session; user: User } | null =
            await auth.api.getSession({ headers });

          return session;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new AuthenticationError({
                cause,
                message: "Failed to get session",
              }),
          ),
        ),
      getSessionOrThrow: (headers: Headers) =>
        Effect.tryPromise(async () => {
          const session: { session: Session; user: User } | null =
            await auth.api.getSession({ headers });

          return session;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new AuthenticationError({
                cause,
                message: "Failed to get session",
              }),
          ),
          Effect.filterOrFail(
            (session) => !!session,
            () =>
              new AuthenticationError({
                message: "Session is not valid",
              }),
          ),
        ),
      getActiveOrganization: (headers: Headers) =>
        Effect.tryPromise(() => auth.api.getFullOrganization({ headers })).pipe(
          Effect.mapError(
            (cause) =>
              new OrganizationMembershipError({
                message: "Failed to retrieve active organization from session",
                cause,
              }),
          ),
        ),
      getActiveOrganizationOrThrow: (headers: Headers) =>
        Effect.tryPromise(() => auth.api.getFullOrganization({ headers })).pipe(
          Effect.mapError(
            (cause) =>
              new OrganizationMembershipError({
                message: "Failed to retrieve active organization from session",
                cause,
              }),
          ),
          Effect.filterOrFail(
            (org) => !!org,
            () =>
              new OrganizationMembershipError({
                message: "No active organization found for the current session",
              }),
          ),
        ),
    };
  }),
  dependencies: [DatabaseLive],
}) {}

const getClient = Effect.gen(function* () {
  return (yield* AuthService).auth;
}).pipe(Effect.provide(AuthService.Default));

export const auth = await runtime.runPromise(getClient);
