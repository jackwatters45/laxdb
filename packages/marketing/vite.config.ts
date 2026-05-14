import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

import { runMarketingPrerenderConfig } from "./src/lib/marketing-prerender";

const cssModuleLocalsConvention = "camelCase" as const;

export default defineConfig(async () => {
  const { pages, filter } = await runMarketingPrerenderConfig({
    rootDirectory: import.meta.dirname,
  });

  return {
    build: {
      target: "esnext",
      rollupOptions: {
        external: ["node:async_hooks", "cloudflare:workers"],
      },
    },
    plugins: [
      contentCollections(),
      viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackStart({
        pages,
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: true,
          crawlLinks: true,
          failOnError: true,
          filter,
        },
      }),
      viteReact(),
    ],
    server: {
      watch: {
        ignored: ["**/routeTree.gen.ts", "**/.tanstack/**"],
      },
    },
    css: {
      modules: {
        localsConvention: cssModuleLocalsConvention,
      },
    },
  };
});
