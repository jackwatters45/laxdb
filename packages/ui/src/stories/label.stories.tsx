import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const meta = {
  component: Label,
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid max-w-sm gap-1">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
