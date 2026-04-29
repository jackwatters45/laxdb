import type { Preview, Renderer } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";

// oxlint-disable-next-line import/no-unassigned-import -- Storybook preview must load global styles for all stories
import "../src/globals.css";

const preview: Preview = {
  decorators: [
    withThemeByClassName<Renderer>({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
