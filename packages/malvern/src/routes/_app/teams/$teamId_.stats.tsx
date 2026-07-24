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
import { getTeamPlayerStats, getTeamSummary } from "../../../lib/stats";

export const Route = createFileRoute("/_app/teams/$teamId_/stats")({
  beforeLoad: ({ context, params }) => {
    const team = context.teams.find((entry) => entry.id === params.teamId);
    const canView =
      context.isAdmin ||
      (context.me?.activeMemberId !== null &&
        team?.coachMemberId === context.me?.activeMemberId);
    if (!canView) throw redirect({ to: "/teams" });
  },
  component: TeamStatsPage,
});

const numberOrDash = (value: number | null) => value ?? "—";

function TeamStatsPage() {
  const { teamId } = Route.useParams();
  const ctx = Route.useRouteContext();
  const team = ctx.teams.find((entry) => entry.id === teamId);
  const summaryQuery = useQuery({
    queryKey: ["team-summary", teamId],
    queryFn: () => getTeamSummary({ data: { teamId } }),
  });
  const playersQuery = useQuery({
    queryKey: ["team-player-stats", teamId],
    queryFn: () => getTeamPlayerStats({ data: { teamId } }),
  });
  const error = summaryQuery.error ?? playersQuery.error;

  return (
    <div className="flex flex-col gap-8">
      <TeamPageHeader
        teamName={team?.name ?? "Team"}
        title="Team statistics"
        description="Current-season team record and player totals, with local entries kept separate from GameDay."
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {summaryQuery.isPending || playersQuery.isPending ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading statistics…
        </p>
      ) : (
        <>
          {summaryQuery.data && (
            <section className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Played", summaryQuery.data.played],
                  [
                    "Record",
                    `${summaryQuery.data.wins}-${summaryQuery.data.losses}-${summaryQuery.data.draws}`,
                  ],
                  ["Goals for", summaryQuery.data.goalsFor],
                  ["Goals against", summaryQuery.data.goalsAgainst],
                  ["Goal difference", summaryQuery.data.goalDifference],
                  ["Assisted goals", summaryQuery.data.assistedGoals],
                ].map(([label, value]) => (
                  <Card key={label} size="sm">
                    <CardContent className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {label}
                      </div>
                      <div className="text-2xl font-semibold tabular-nums">
                        {value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Manual stats entered for {summaryQuery.data.gamesWithStats} of{" "}
                {summaryQuery.data.played} completed games
                {summaryQuery.data.shots === null
                  ? ""
                  : ` · ${summaryQuery.data.shots} shots`}
                {summaryQuery.data.saves === null
                  ? ""
                  : ` · ${summaryQuery.data.saves} saves`}
                .
              </p>
            </section>
          )}

          {playersQuery.data && (
            <>
              <PlayerStatsCard
                title="Locally entered player stats"
                description="Totals from fixture stat sheets entered in this app. Partial coverage is allowed."
                rows={playersQuery.data.manual.map((row) => ({
                  id: row.rosterPlayerId,
                  name: row.playerName,
                  jersey: row.jerseyNumber,
                  games: row.gamesPlayed,
                  goals: row.goals,
                  assists: row.assists,
                  points: row.points,
                  shots: row.shots,
                  saves: row.saves,
                }))}
              />
              <PlayerStatsCard
                title="GameDay season totals"
                description="Published GameDay totals. These are shown separately and are never added to local entries."
                rows={playersQuery.data.gameday.map((row) => ({
                  id: row.rosterPlayerId,
                  name: row.playerName,
                  jersey: row.jerseyNumber,
                  games: row.gamesPlayed,
                  goals: row.goals,
                  assists: row.assists,
                  points: row.points,
                  shots: null,
                  saves: null,
                }))}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function PlayerStatsCard(props: {
  readonly title: string;
  readonly description: string;
  readonly rows: readonly {
    id: string;
    name: string;
    jersey: number | null;
    games: number | null;
    goals: number | null;
    assists: number | null;
    points: number | null;
    shots: number | null;
    saves: number | null;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {props.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No statistics yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>GP</TableHead>
                <TableHead>G</TableHead>
                <TableHead>A</TableHead>
                <TableHead>P</TableHead>
                <TableHead>Shots</TableHead>
                <TableHead>Saves</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{numberOrDash(row.jersey)}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{numberOrDash(row.games)}</TableCell>
                  <TableCell>{numberOrDash(row.goals)}</TableCell>
                  <TableCell>{numberOrDash(row.assists)}</TableCell>
                  <TableCell className="font-medium">
                    {numberOrDash(row.points)}
                  </TableCell>
                  <TableCell>{numberOrDash(row.shots)}</TableCell>
                  <TableCell>{numberOrDash(row.saves)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
