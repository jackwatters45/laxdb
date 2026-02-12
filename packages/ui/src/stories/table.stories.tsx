import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const meta = {
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const DATA = [
  { player: "Lyle Thompson", team: "Whipsnakes", goals: 34, assists: 52 },
  { player: "Jeff Teat", team: "Waterdogs", goals: 29, assists: 41 },
  { player: "Mac O'Keefe", team: "Chaos", goals: 25, assists: 18 },
  { player: "Tom Schreiber", team: "Atlas", goals: 22, assists: 33 },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>2024 PLL season leaders</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Goals</TableHead>
          <TableHead>Assists</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {DATA.map((row) => (
          <TableRow key={row.player}>
            <TableCell className="font-medium">{row.player}</TableCell>
            <TableCell>{row.team}</TableCell>
            <TableCell>{row.goals}</TableCell>
            <TableCell>{row.assists}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
