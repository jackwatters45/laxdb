import type { Meta, StoryObj } from "@storybook/react-vite";

import { AspectRatio } from "../components/ui/aspect-ratio";

const meta = {
  component: AspectRatio,
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ratio: 16 / 9 },
  render: (args) => (
    <div className="max-w-sm">
      <AspectRatio {...args}>
        <div className="flex size-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
          16:9
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  args: { ratio: 1 },
  render: (args) => (
    <div className="max-w-48">
      <AspectRatio {...args}>
        <div className="flex size-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
          1:1
        </div>
      </AspectRatio>
    </div>
  ),
};
