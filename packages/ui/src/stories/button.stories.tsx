import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, Settings, Trash2 } from "lucide-react";

import { Button } from "../components/ui/button";

const meta = {
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "outline",
        "ghost",
        "destructive",
        "bracket",
        "bracket-ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg", "icon", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Button" },
};

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
};

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
};

export const Ghost: Story = {
  args: { children: "Ghost", variant: "ghost" },
};

export const Destructive: Story = {
  args: { children: "Destructive", variant: "destructive" },
};

export const Link: Story = {
  args: { children: "Link", variant: "link" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">SM</Button>
      <Button size="default">Default</Button>
      <Button size="lg">LG</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};

export const IconSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="icon-sm">
        <Plus />
      </Button>
      <Button size="icon">
        <Settings />
      </Button>
      <Button size="icon-lg">
        <Trash2 />
      </Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="bracket">Bracket</Button>
        <Button variant="bracket-ghost">Bracket Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">SM</Button>
        <Button size="default">Default</Button>
        <Button size="lg">LG</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="icon-sm">
          <Plus />
        </Button>
        <Button size="icon">
          <Settings />
        </Button>
        <Button size="icon-lg">
          <Trash2 />
        </Button>
      </div>
    </div>
  ),
};
