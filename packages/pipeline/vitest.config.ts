import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    poolOptions: {
      miniflare: {},
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
      },
    },
  },
});
