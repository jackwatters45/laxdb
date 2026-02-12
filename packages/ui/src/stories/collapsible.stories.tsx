import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";

const meta = {
  component: Collapsible,
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="max-w-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Team Roster</span>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
          Toggle
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-3 py-2 text-xs">Player 1</div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-3 py-2 text-xs">Player 2</div>
        <div className="rounded-md border px-3 py-2 text-xs">Player 3</div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
