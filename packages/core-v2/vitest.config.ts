import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    fileParallelism: false,
    globalSetup: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      reportsDirectory: "./.coverage",
      include: ["src/**/*.test.ts"],
      // exclude: [
      //   "src/**/*.test.ts",
      //   "src/**/*.sql.ts",
      //   "src/**/index.ts",
      //   "src/drizzle/**",
      //   "src/auth/**",
      //   "src/config.ts",
      //   "src/kv.ts",
      //   "src/type.ts",
      //   "src/test/**",
      // ],
    },
  },
});
