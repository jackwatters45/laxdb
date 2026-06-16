import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    rollupOptions: {
      // `cloudflare:workers` is a worker runtime built-in, resolved at runtime
      // via the dynamic import in src/lib/api-client.ts. Mark it external so
      // the client build doesn't try (and fail) to resolve it.
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
