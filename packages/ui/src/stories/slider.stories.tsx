import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slider } from "../components/ui/slider";

const meta = {
  component: Slider,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <Slider defaultValue={[50]} max={100} />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="max-w-sm">
      <Slider defaultValue={[25, 75]} max={100} />
    </div>
  ),
};
