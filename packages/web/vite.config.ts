import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import alchemy from "alchemy/cloudflare/tanstack-start";

const config = defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      external: [
        "node:async_hooks",
        "cloudflare:workers",
        // Server-only packages - exclude from client bundle
        "postgres",
        "@effect/sql-pg",
        "pg",
        "perf_hooks",
        "node:perf_hooks",
      ],
    },
  },
  plugins: [
    alchemy(),
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(),
    viteReact(),
  ],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});

export default config;
