import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/ui/hover-card";

const meta = {
  component: HoverCard,
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger
        render={<a href="#" className="text-xs font-medium underline underline-offset-4" />}
      >
        @laxdb
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>LX</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-xs font-medium">laxdb</p>
            <p className="text-xs text-muted-foreground">Lacrosse team management platform.</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
