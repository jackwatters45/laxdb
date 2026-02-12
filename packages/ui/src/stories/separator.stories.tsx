import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "../components/ui/separator";

const meta = {
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="max-w-sm space-y-4">
      <p className="text-xs">Content above</p>
      <Separator />
      <p className="text-xs">Content below</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-4">
      <span className="text-xs">Item 1</span>
      <Separator orientation="vertical" />
      <span className="text-xs">Item 2</span>
      <Separator orientation="vertical" />
      <span className="text-xs">Item 3</span>
    </div>
  ),
};
