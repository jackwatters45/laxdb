import { type Config, defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/**/*.sql.ts", "./src/**/*.view.ts"],
  out: "./migrations",
  dbCredentials: {
    ssl: "require",
    // oxlint-disable-next-line no-non-null-assertion - derived from alchemy
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    schema: "public",
  },
  verbose: true,
  strict: true,
}) satisfies Config;
