import { type Config, defineConfig } from "drizzle-kit";
import { Env } from "./src/config";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/**/*.sql.ts", "./src/**/*.view.ts"],
  out: "./migrations",
  dbCredentials: {
    ssl: "require",
    url: Env.DATABASE_URL(),
  },
  migrations: {
    schema: "public",
  },
  verbose: true,
  strict: true,
}) satisfies Config;
