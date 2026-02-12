import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold } from "lucide-react";

import { Toggle } from "../components/ui/toggle";

const meta = {
  component: Toggle,
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["sm", "default", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Toggle" },
};

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
};

export const WithIcon: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <Bold />
    </Toggle>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle size="sm">SM</Toggle>
      <Toggle size="default">Default</Toggle>
      <Toggle size="lg">LG</Toggle>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Default variant</p>
        <div className="flex items-center gap-2">
          <Toggle size="sm">SM</Toggle>
          <Toggle size="default">Default</Toggle>
          <Toggle size="lg">LG</Toggle>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Outline variant</p>
        <div className="flex items-center gap-2">
          <Toggle variant="outline" size="sm">
            SM
          </Toggle>
          <Toggle variant="outline" size="default">
            Default
          </Toggle>
          <Toggle variant="outline" size="lg">
            LG
          </Toggle>
        </div>
      </div>
    </div>
  ),
};
