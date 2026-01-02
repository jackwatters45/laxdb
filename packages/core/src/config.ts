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

export const Env = {
  DATABASE_URL: () => requireEnv("DATABASE_URL"),
  API_URL: () => requireEnv("API_URL"),

  BETTER_AUTH_SECRET: () => requireEnv("BETTER_AUTH_SECRET"),
  GOOGLE_CLIENT_ID: () => requireEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: () => requireEnv("GOOGLE_CLIENT_SECRET"),
  POLAR_WEBHOOK_SECRET: () => requireEnv("POLAR_WEBHOOK_SECRET"),

  ALCHEMY_PASSWORD: () => requireEnv("ALCHEMY_PASSWORD"),
  ALCHEMY_STATE_TOKEN: () => requireEnv("ALCHEMY_STATE_TOKEN"),

  CLOUDFLARE_ACCOUNT_ID: () => requireEnv("CLOUDFLARE_ACCOUNT_ID"),
  CLOUDFLARE_API_TOKEN: () => requireEnv("CLOUDFLARE_API_TOKEN"),
  CLOUDFLARE_EMAIL: () => requireEnv("CLOUDFLARE_EMAIL"),

  PLANETSCALE_ORGANIZATION: () => requireEnv("PLANETSCALE_ORGANIZATION"),
  PLANETSCALE_SERVICE_TOKEN: () => requireEnv("PLANETSCALE_SERVICE_TOKEN"),
  PLANETSCALE_SERVICE_TOKEN_ID: () =>
    requireEnv("PLANETSCALE_SERVICE_TOKEN_ID"),

  PLL_GRAPHQL_TOKEN: () => requireEnv("PLL_GRAPHQL_TOKEN"),
  PLL_REST_TOKEN: () => requireEnv("PLL_REST_TOKEN"),
} as const;
