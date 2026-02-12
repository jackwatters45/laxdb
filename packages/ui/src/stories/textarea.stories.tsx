import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

const meta = {
  component: Textarea,
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Write something..." },
};

export const WithLabel: Story = {
  render: () => (
    <div className="max-w-sm space-y-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" placeholder="Tell us about yourself..." />
    </div>
  ),
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};
