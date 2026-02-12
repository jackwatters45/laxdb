import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const meta = {
  component: Input,
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    type: { control: "select", options: ["text", "email", "password", "number", "file"] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Type something..." },
};

export const WithLabel: Story = {
  render: () => (
    <div className="max-w-sm space-y-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="name@example.com" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};

export const File: Story = {
  args: { type: "file" },
};
