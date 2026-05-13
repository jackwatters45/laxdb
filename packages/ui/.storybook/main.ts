import tailwindcss from "@tailwindcss/vite";
import type { StorybookConfig } from "@storybook/react-vite";

const storybookConfig: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/stories/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-themes"],
  viteFinal(viteConfig) {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(tailwindcss());
    return viteConfig;
  },
};

export default storybookConfig;
