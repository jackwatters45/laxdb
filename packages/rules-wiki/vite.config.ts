import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: { target: "esnext" },
  plugins: [react()],
});
