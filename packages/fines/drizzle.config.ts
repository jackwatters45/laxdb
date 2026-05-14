import { type Config, defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: ["./src/**/*.sql.ts"],
  out: "./migrations",
  verbose: true,
  strict: true,
}) satisfies Config;
