import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";

import { createAuth, type Auth } from "../core/auth/auth";

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TRUSTED_ORIGINS?: string;
};

let cachedAuth: Auth | undefined;

const createWorkerAuth = (workerEnv: Env): Auth =>
  createAuth({
    db: workerEnv.DB,
    secret: workerEnv.BETTER_AUTH_SECRET,
    baseURL: workerEnv.BETTER_AUTH_URL,
    trustedOrigins: workerEnv.TRUSTED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    useSecureCookies: !workerEnv.BETTER_AUTH_URL.startsWith("http://"),
    extraPlugins: [tanstackStartCookies()],
    sendMagicLink: ({ email, url }) => {
      console.log(`[magic-link] to=${email} url=${url}`);
    },
    sendInvitationEmail: ({ email, inviteLink, organizationName }) => {
      console.log(
        `[invite] to=${email} org=${organizationName} link=${inviteLink}`,
      );
    },
  });

export const getAuth = (): Auth => {
  if (cachedAuth) return cachedAuth;
  cachedAuth = createWorkerAuth(env as Env);
  return cachedAuth;
};
