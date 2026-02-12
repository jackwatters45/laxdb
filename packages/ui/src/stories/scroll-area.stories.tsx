import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";

const meta = {
  component: ScrollArea,
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const players = [
  "Thompson, Lyle",
  "Rabil, Paul",
  "Powell, Mikey",
  "Gait, Gary",
  "Gait, Paul",
  "Cannella, Joe",
  "Tierney, Trevor",
  "Schwartzman, Jeff",
  "Stanwick, Steele",
  "Cockerton, John",
  "Brown, Jim",
  "Simmons, Kyle",
  "Grant, Myles",
  "Harrison, Kyle",
  "Walters, Matt",
];

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-48 rounded-md border">
      <div className="p-3">
        <p className="mb-2 text-xs font-medium">Players</p>
        {players.map((player) => (
          <div key={player}>
            <p className="py-1 text-xs">{player}</p>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
