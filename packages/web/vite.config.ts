import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { devtools } from "@tanstack/devtools-vite";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      external: ["node:async_hooks", "cloudflare:workers"],
    },
  },
  plugins: [
    devtools(),
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    alchemy(),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
             plugins: ['babel-plugin-react-compiler'],
           },
    }),
  ],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});

export default config;
