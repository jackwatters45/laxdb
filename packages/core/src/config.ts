import { Config } from "effect";

export const AppConfig = {
  databaseUrl: Config.redacted("DATABASE_URL"),

  googleClientId: Config.string("GOOGLE_CLIENT_ID"),
  googleClientSecret: Config.redacted("GOOGLE_CLIENT_SECRET"),

  polarWebhookSecret: Config.redacted("POLAR_WEBHOOK_SECRET"),

  awsRegion: Config.string("AWS_REGION").pipe(Config.withDefault("us-west-2")),
  emailSender: Config.string("EMAIL_SENDER").pipe(
    Config.withDefault("noreply@laxdb.io"),
  ),

  apiUrl: Config.string("API_URL"),
} as const;
