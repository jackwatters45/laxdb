import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

const meta = {
  component: Switch,
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultChecked: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane" defaultChecked />
      <Label htmlFor="airplane">Airplane Mode</Label>
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="small" size="sm" defaultChecked />
      <Label htmlFor="small">Small</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
