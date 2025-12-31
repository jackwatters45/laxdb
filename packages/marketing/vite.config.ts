import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import contentCollections from "@content-collections/vite";
import alchemy from "alchemy/cloudflare/tanstack-start";
import tailwindcss from "@tailwindcss/vite";

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
    alchemy(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
