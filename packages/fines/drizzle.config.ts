import { defineConfig } from "drizzle-kit";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required for fines migrations`);
  }
  return value;
};

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: ["./src/**/*.sql.ts"],
  out: "./migrations",
  dbCredentials: {
    accountId: requireEnv("CLOUDFLARE_ACCOUNT_ID"),
    databaseId: requireEnv("DATABASE_ID"),
    token: requireEnv("CLOUDFLARE_API_TOKEN"),
  },
  verbose: true,
  strict: true,
});
