import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress } from "../components/ui/progress";

const meta = {
  component: Progress,
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 60 },
  render: (args) => (
    <div className="max-w-sm">
      <Progress {...args} />
    </div>
  ),
};

export const States: Story = {
  args: { value: 50 },
  render: () => (
    <div className="max-w-sm space-y-4">
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={75} />
      <Progress value={100} />
    </div>
  ),
};
