import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const meta = {
  component: Card,
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Player Stats</CardTitle>
        <CardDescription>Season overview for 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          34 goals, 52 assists, 86 points across 18 games.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  render: () => (
    <Card size="sm" className="max-w-sm">
      <CardHeader>
        <CardTitle>Compact Card</CardTitle>
        <CardDescription>Uses tighter padding</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Content here.</p>
      </CardContent>
    </Card>
  ),
};
