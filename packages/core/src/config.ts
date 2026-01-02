import { Config } from "effect";

export const AppConfig = Config.all({
  databaseUrl: Config.redacted("DATABASE_URL"),
  apiUrl: Config.string("API_URL"),

  betterAuthSecret: Config.redacted("BETTER_AUTH_SECRET"),
  googleClientId: Config.string("GOOGLE_CLIENT_ID"),
  googleClientSecret: Config.redacted("GOOGLE_CLIENT_SECRET"),
  polarWebhookSecret: Config.redacted("POLAR_WEBHOOK_SECRET"),

  alchemyPassword: Config.redacted("ALCHEMY_PASSWORD"),
  alchemyStateToken: Config.redacted("ALCHEMY_STATE_TOKEN"),

  cloudflareAccountId: Config.string("CLOUDFLARE_ACCOUNT_ID"),
  cloudflareApiToken: Config.redacted("CLOUDFLARE_API_TOKEN"),
  cloudflareEmail: Config.string("CLOUDFLARE_EMAIL"),

  planetscaleOrganization: Config.string("PLANETSCALE_ORGANIZATION"),
  planetscaleServiceToken: Config.redacted("PLANETSCALE_SERVICE_TOKEN"),
  planetscaleServiceTokenId: Config.string("PLANETSCALE_SERVICE_TOKEN_ID"),

  pllGraphqlToken: Config.redacted("PLL_GRAPHQL_TOKEN"),
  pllRestToken: Config.redacted("PLL_REST_TOKEN"),

  awsRegion: Config.string("AWS_REGION").pipe(Config.withDefault("us-west-2")),
  emailSender: Config.string("EMAIL_SENDER").pipe(
    Config.withDefault("noreply@laxdb.io"),
  ),
});

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
};

/**
 * Synchronous environment access for non-sensitive values only.
 *
 * WHY THIS EXISTS:
 * Effect Config (AppConfig) requires being inside an Effect context to access values.
 * However, some patterns like AtomHttpApi.Tag and AtomRpc.Tag need configuration at
 * module definition time (outside Effect context). This helper provides synchronous
 * access for those specific cases.
 *
 * SECURITY:
 * - Only non-sensitive values (public URLs) should be exposed here
 * - Secrets MUST use AppConfig with Config.redacted() for proper redaction in logs
 * - If you need a secret synchronously, refactor to defer the access into Effect context
 */
export const Env = {
  API_URL: () => requireEnv("API_URL"),
} as const;
