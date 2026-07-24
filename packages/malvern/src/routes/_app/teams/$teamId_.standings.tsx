import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@laxdb/ui/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { TeamPageHeader } from "../../../components/team-page-header";
import { getTeamStandings } from "../../../lib/stats";

export const Route = createFileRoute("/_app/teams/$teamId_/standings")({
  beforeLoad: ({ context, params }) => {
    const team = context.teams.find((entry) => entry.id === params.teamId);
    const canView =
      context.isAdmin ||
      (context.me?.activeMemberId !== null &&
        team?.coachMemberId === context.me?.activeMemberId);
    if (!canView) throw redirect({ to: "/teams" });
  },
  component: TeamStandingsPage,
});

function TeamStandingsPage() {
  const { teamId } = Route.useParams();
  const ctx = Route.useRouteContext();
  const team = ctx.teams.find((entry) => entry.id === teamId);
  const standingsQuery = useQuery({
    queryKey: ["team-standings", teamId],
    queryFn: () => getTeamStandings({ data: { teamId } }),
    retry: false,
  });

  return (
    <div className="flex flex-col gap-8">
      <TeamPageHeader
        teamId={teamId}
        teamName={team?.name ?? "Team"}
        title="Standings"
        description="The published GameDay ladder for this team's current competition."
      />

      {standingsQuery.error && (
        <Alert variant="destructive">
          <AlertDescription>{standingsQuery.error.message}</AlertDescription>
        </Alert>
      )}

      {standingsQuery.isPending ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading standings…
        </p>
      ) : standingsQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle>{standingsQuery.data.compName}</CardTitle>
            <CardDescription>
              Cached {standingsQuery.data.fetchedAt.toLocaleString()}
              {standingsQuery.data.sourceUploadedAt === null
                ? ""
                : ` · GameDay uploaded ${standingsQuery.data.sourceUploadedAt}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pos</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>P</TableHead>
                  <TableHead>W</TableHead>
                  <TableHead>L</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>GF</TableHead>
                  <TableHead>GA</TableHead>
                  <TableHead>GD</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standingsQuery.data.rows.map((row) => (
                  <TableRow
                    key={`${row.position}:${row.teamName}`}
                    className={
                      row.gamedayTeamId === standingsQuery.data.gamedayTeamId
                        ? "bg-muted/55 font-medium"
                        : undefined
                    }
                  >
                    <TableCell>{row.position}</TableCell>
                    <TableCell>{row.teamName}</TableCell>
                    <TableCell>{row.played}</TableCell>
                    <TableCell>{row.wins}</TableCell>
                    <TableCell>{row.losses}</TableCell>
                    <TableCell>{row.draws}</TableCell>
                    <TableCell>{row.goalsFor}</TableCell>
                    <TableCell>{row.goalsAgainst}</TableCell>
                    <TableCell>{row.goalDifference}</TableCell>
                    <TableCell>{row.percentage.toFixed(2)}</TableCell>
                    <TableCell>{row.premiershipPoints}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
