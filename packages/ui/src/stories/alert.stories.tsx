import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertCircle, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

const meta = {
  component: Alert,
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert className="max-w-md">
      <Info />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircle />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again.</AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <Alert>
        <Info />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>This is the default alert variant.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>This is the destructive alert variant.</AlertDescription>
      </Alert>
    </div>
  ),
};
