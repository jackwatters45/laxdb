import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    fileParallelism: false,
    globalSetup: "../core/src/test/setup.ts",
    include: ["src/**/*.test.ts"],
  },
});
