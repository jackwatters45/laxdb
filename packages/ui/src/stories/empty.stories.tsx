import type { Meta, StoryObj } from "@storybook/react-vite";
import { InboxIcon } from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../components/ui/empty";

const meta = {
  component: Empty,
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No games found</EmptyTitle>
        <EmptyDescription>Get started by scheduling your first game.</EmptyDescription>
      </EmptyHeader>
      <Button size="sm">Schedule Game</Button>
    </Empty>
  ),
};
