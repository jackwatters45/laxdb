import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@laxdb/ui/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface LeaderboardEntry {
  statId: number;
  rank: number;
  playerId: number;
  playerName: string;
  position: string | null;
  teamName: string | null;
  teamAbbreviation: string | null;
  leagueAbbreviation: string;
  goals: number;
  assists: number;
  points: number;
  gamesPlayed: number;
}

interface StatsTableProps {
  data: LeaderboardEntry[];
  sort: "points" | "goals" | "assists";
  order: "asc" | "desc";
  onSort: (column: "points" | "goals" | "assists") => void;
}

export function StatsTable({ data, sort, order, onSort }: StatsTableProps) {
  const getSortIcon = (column: "points" | "goals" | "assists") => {
    if (sort !== column) {
      return <ArrowUpDown className="ml-1 inline h-4 w-4 text-muted-foreground" />;
    }
    return order === "asc" ? (
      <ArrowUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 inline h-4 w-4" />
    );
  };

  const sortableHeader = (
    column: "points" | "goals" | "assists",
    label: string,
  ) => (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="flex items-center font-medium hover:text-primary"
    >
      {label}
      {getSortIcon(column)}
    </button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>League</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">GP</TableHead>
            <TableHead className="text-right">
              {sortableHeader("goals", "G")}
            </TableHead>
            <TableHead className="text-right">
              {sortableHeader("assists", "A")}
            </TableHead>
            <TableHead className="text-right">
              {sortableHeader("points", "PTS")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                No stats found. Try adjusting your league filters.
              </TableCell>
            </TableRow>
          ) : (
            data.map((entry, index) => (
              <TableRow key={entry.statId} className="hover:bg-muted/30">
                <TableCell className="text-center font-mono text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{entry.playerName}</TableCell>
                <TableCell>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    {entry.leagueAbbreviation}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.teamName ?? "-"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {entry.gamesPlayed}
                </TableCell>
                <TableCell className="text-right font-mono">{entry.goals}</TableCell>
                <TableCell className="text-right font-mono">{entry.assists}</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {entry.points}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
