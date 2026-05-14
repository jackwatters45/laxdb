import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";

import { createAuth, type Auth } from "../core/auth/auth";

type Env = {
  readonly DB: D1Database;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly TRUSTED_ORIGINS?: string;
};

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isEnv = (value: unknown): value is Env =>
  isRecord(value) &&
  isRecord(value.DB) &&
  typeof value.BETTER_AUTH_SECRET === "string" &&
  typeof value.BETTER_AUTH_URL === "string" &&
  (value.TRUSTED_ORIGINS === undefined ||
    typeof value.TRUSTED_ORIGINS === "string");

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
  if (!isEnv(env)) throw new Error("Fines worker environment is invalid");
  cachedAuth = createWorkerAuth(env);
  return cachedAuth;
};
