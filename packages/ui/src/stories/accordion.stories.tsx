import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

const meta = {
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion className="max-w-sm">
      <AccordionItem>
        <AccordionTrigger>What is laxdb?</AccordionTrigger>
        <AccordionContent>
          A lacrosse team and club management platform built for coaches, players, and
          organizations.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionTrigger>How does scoring work?</AccordionTrigger>
        <AccordionContent>
          Goals are tracked per player with assists, ground balls, and other stats recorded in
          real-time.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionTrigger>Can I manage multiple teams?</AccordionTrigger>
        <AccordionContent>
          Yes, organizations can manage multiple teams across different age groups and skill levels.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
