import type { Preview, Renderer } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";

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
