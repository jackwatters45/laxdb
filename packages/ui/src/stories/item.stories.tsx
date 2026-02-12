import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserIcon } from "lucide-react";

import { Badge } from "../components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "../components/ui/item";

const meta = {
  component: Item,
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Lyle Thompson</ItemTitle>
          <ItemDescription>Attack · #4 · Albany</ItemDescription>
        </ItemContent>
        <Badge variant="outline">Active</Badge>
      </Item>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="max-w-sm space-y-4">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Default</p>
        <Item>
          <ItemMedia variant="icon">
            <UserIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Default variant</ItemTitle>
            <ItemDescription>No border, transparent background.</ItemDescription>
          </ItemContent>
        </Item>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Outline</p>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <UserIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Outline variant</ItemTitle>
            <ItemDescription>Bordered container.</ItemDescription>
          </ItemContent>
        </Item>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Muted</p>
        <Item variant="muted">
          <ItemMedia variant="icon">
            <UserIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Muted variant</ItemTitle>
            <ItemDescription>Subtle background fill.</ItemDescription>
          </ItemContent>
        </Item>
      </div>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="max-w-sm">
      <ItemGroup>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <UserIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Paul Rabil</ItemTitle>
            <ItemDescription>Midfield · #99</ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <UserIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Mikey Powell</ItemTitle>
            <ItemDescription>Attack · #22</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  ),
};
