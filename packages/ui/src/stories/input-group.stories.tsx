import type { Meta, StoryObj } from "@storybook/react-vite";
import { MailIcon, SearchIcon } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/ui/input-group";

const meta = {
  component: InputGroup,
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => (
    <div className="max-w-sm">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search players..." />
      </InputGroup>
    </div>
  ),
};

export const WithAddonEnd: Story = {
  render: () => (
    <div className="max-w-sm">
      <InputGroup>
        <InputGroupInput placeholder="Email address" />
        <InputGroupAddon align="inline-end">
          <MailIcon />
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};
