import { readFileSync, readdirSync } from "node:fs";
import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

import { pagefindSearch } from "./vite/pagefind";

const contentDirectory = new URL("./src/content/", import.meta.url);
const draftFrontmatterPattern = /^---[\s\S]*?\bdraft:\s*true\b[\s\S]*?---/u;
const contentPages: { path: string }[] = [];

for (const entry of readdirSync(contentDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;

  const source = readFileSync(new URL(entry.name, contentDirectory), "utf8");
  if (draftFrontmatterPattern.test(source)) continue;

  contentPages.push({ path: `/content/${entry.name.replace(/\.mdx$/u, "")}` });
}

export default defineConfig({
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
      pages: [{ path: "/wiki" }, ...contentPages],
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
      },
    }),
    viteReact(),
    pagefindSearch({
      index: {
        forceLanguage: "en",
      },
    }),
  ],
  server: {
    watch: {
      ignored: ["**/routeTree.gen.ts", "**/.tanstack/**"],
    },
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
