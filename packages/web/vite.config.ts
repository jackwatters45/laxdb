import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import alchemy from 'alchemy/cloudflare/tanstack-start';

const config = defineConfig({
  plugins: [
    alchemy() as PluginOption,
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});

export default config;
