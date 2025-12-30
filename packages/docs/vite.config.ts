import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import mdx from "fumadocs-mdx/vite";
import alchemy from "alchemy/cloudflare/tanstack-start";

export default defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      external: ["node:async_hooks", "cloudflare:workers"],
    },
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    mdx(await import("./source.config")),
    tailwindcss(),
    alchemy(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          outputPath: "index.html",
          enabled: true,
          // Disabled crawlLinks because fumadocs server functions don't work
          // in TanStack Start's prerender environment (returns 500 error).
          // TODO: Investigate how to properly static render /docs/* pages
          // with fumadocs + TanStack Start. May need custom prerender logic
          // or fumadocs SSG mode.
          crawlLinks: false,
        },
      },
      pages: [
        // TODO: Investigate how to properly static render /docs/* pages
        // {
        //   path: "/docs",
        // },
        {
          path: "/api/search",
        },
      ],
    }),
    react(),
  ],
});
