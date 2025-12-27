import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import alchemy from "alchemy/cloudflare/tanstack-start";

const config = defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      external: ["node:async_hooks", "cloudflare:workers"],
    },
  },
  // build: {
  //   target: "esnext",
  //   rollupOptions: {
  //     external: [
  //       "node:async_hooks",
  //       "cloudflare:workers",
  //       // non-standard
  //       "node:stream",
  //       "node:stream/web",
  //       "node:perf_hooks",
  //       "perf_hooks",
  //       "postgres",
  //       "@effect/sql-pg",
  //       "pg",
  //     ],
  //   },
  // },
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    alchemy(),
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
