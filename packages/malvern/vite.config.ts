import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      external: ["node:async_hooks", "cloudflare:workers"],
    },
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      router: { generatedRouteTree: "./route-tree.gen.ts" },
      server: { entry: "./src/server.ts" },
    }),
    react(),
  ],
  server: {
    watch: {
      ignored: ["**/route-tree.gen.ts", "**/.tanstack/**"],
    },
  },
});
