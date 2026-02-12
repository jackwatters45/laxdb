import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

const meta = {
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="midfield" className="max-w-sm">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="attack" id="attack" />
        <Label htmlFor="attack">Attack</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="midfield" id="midfield" />
        <Label htmlFor="midfield">Midfield</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="defense" id="defense" />
        <Label htmlFor="defense">Defense</Label>
      </div>
    </RadioGroup>
  ),
};
