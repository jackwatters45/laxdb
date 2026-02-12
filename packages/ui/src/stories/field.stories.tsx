import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../components/ui/field";

const meta = {
  component: Field,
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="name">Player Name</FieldLabel>
        <Input id="name" placeholder="Enter player name" />
        <FieldDescription>Full name as it appears on the roster.</FieldDescription>
      </Field>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="max-w-sm">
      <Field data-invalid="true">
        <FieldLabel htmlFor="jersey">Jersey Number</FieldLabel>
        <Input id="jersey" aria-invalid="true" defaultValue="999" />
        <FieldError errors={[{ message: "Jersey number must be between 0 and 99." }]} />
      </Field>
    </div>
  ),
};

export const GroupVertical: Story = {
  render: () => (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="first">First Name</FieldLabel>
        <Input id="first" placeholder="First" />
      </Field>
      <Field>
        <FieldLabel htmlFor="last">Last Name</FieldLabel>
        <Input id="last" placeholder="Last" />
      </Field>
    </FieldGroup>
  ),
};
