import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";

const meta = {
  component: Sheet,
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open Sheet</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Player Details</SheetTitle>
          <SheetDescription>View and edit player information.</SheetDescription>
        </SheetHeader>
        <div className="p-6 text-xs">Sheet body content goes here.</div>
        <SheetFooter>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open Left</SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse sections.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
