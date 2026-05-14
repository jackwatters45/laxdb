import type { BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink, organization } from "better-auth/plugins";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
} from "./auth.sql.ts";

export type AuthConfig = {
  db: D1Database;
  secret: string;
  baseURL: string;
  trustedOrigins?: string[] | undefined;
  useSecureCookies?: boolean | undefined;
  extraPlugins?: BetterAuthPlugin[] | undefined;
  sendMagicLink: (args: {
    email: string;
    url: string;
    token: string;
  }) => Promise<void> | void;
  sendInvitationEmail: (args: {
    email: string;
    inviteLink: string;
    inviterName: string;
    organizationName: string;
  }) => Promise<void> | void;
};

export const createAuth = (config: AuthConfig) => {
  const db = drizzle(config.db);

  return betterAuth({
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    advanced: {
      useSecureCookies: config.useSecureCookies ?? true,
    },
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        organization: organizations,
        member: members,
        invitation: invitations,
      },
    }),
    emailAndPassword: { enabled: false },
    plugins: [
      magicLink({
        expiresIn: 60 * 15,
        sendMagicLink: async ({ email, url, token }) => {
          await config.sendMagicLink({ email, url, token });
        },
      }),
      organization({
        allowUserToCreateOrganization: async () => {
          const [row] = await db.select({ c: count() }).from(organizations);
          return (row?.c ?? 0) === 0;
        },
        sendInvitationEmail: async (data) => {
          const inviteLink = `${config.baseURL.replace(/\/api\/auth$/u, "")}/accept-invitation/${data.id}`;
          await config.sendInvitationEmail({
            email: data.email,
            inviteLink,
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
          });
        },
      }),
      ...(config.extraPlugins ?? []),
    ],
  });
};

export type Auth = ReturnType<typeof createAuth>;
