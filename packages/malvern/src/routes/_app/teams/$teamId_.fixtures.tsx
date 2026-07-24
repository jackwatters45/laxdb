import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import {
  Card,
  CardContent,
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
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { TeamPageHeader } from "../../../components/team-page-header";
import { listFixtures, type FixtureView } from "../../../lib/matches";

export const Route = createFileRoute("/_app/teams/$teamId_/fixtures")({
  beforeLoad: ({ context, params }) => {
    const team = context.teams.find((entry) => entry.id === params.teamId);
    const canView =
      context.isAdmin ||
      (context.me?.activeMemberId !== null &&
        team?.coachMemberId === context.me?.activeMemberId);
    if (!canView) throw redirect({ to: "/teams" });
  },
  component: TeamFixturesPage,
});

const opponentOf = (fixture: FixtureView) =>
  fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;

const fixtureDate = (fixture: FixtureView) =>
  fixture.scheduledAt === null
    ? "TBC"
    : new Date(fixture.scheduledAt).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });

const resultOf = (fixture: FixtureView) => {
  if (fixture.homeScore === null || fixture.awayScore === null) return "—";
  const ours = fixture.isHome ? fixture.homeScore : fixture.awayScore;
  const theirs = fixture.isHome ? fixture.awayScore : fixture.homeScore;
  const outcome = ours > theirs ? "W" : ours < theirs ? "L" : "D";
  return `${outcome} ${ours}–${theirs}`;
};

function TeamFixturesPage() {
  const { teamId } = Route.useParams();
  const ctx = Route.useRouteContext();
  const team = ctx.teams.find((entry) => entry.id === teamId);
  const fixturesQuery = useQuery({
    queryKey: ["fixtures", teamId],
    queryFn: () => listFixtures({ data: { teamId } }),
  });
  const now = Date.now();
  const fixtures = fixturesQuery.data ?? [];
  const upcoming = fixtures
    .filter(
      (fixture) =>
        fixture.scheduledAt !== null &&
        new Date(fixture.scheduledAt).getTime() > now,
    )
    .toSorted(
      (a, b) =>
        new Date(a.scheduledAt ?? 0).getTime() -
        new Date(b.scheduledAt ?? 0).getTime(),
    );
  const previous = fixtures
    .filter(
      (fixture) =>
        fixture.scheduledAt === null ||
        new Date(fixture.scheduledAt).getTime() <= now,
    )
    .toSorted(
      (a, b) =>
        new Date(b.scheduledAt ?? 0).getTime() -
        new Date(a.scheduledAt ?? 0).getTime(),
    );

  return (
    <div className="flex flex-col gap-8">
      <TeamPageHeader
        teamName={team?.name ?? "Team"}
        title="Fixtures"
        description="Upcoming games and completed results for this squad."
      />
      {fixturesQuery.error && (
        <Alert variant="destructive">
          <AlertDescription>{fixturesQuery.error.message}</AlertDescription>
        </Alert>
      )}
      {fixturesQuery.isPending ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading fixtures…
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <FixtureTable title="Upcoming" fixtures={upcoming} />
          <FixtureTable title="Previous" fixtures={previous} />
        </div>
      )}
    </div>
  );
}

function FixtureTable(props: {
  readonly title: string;
  readonly fixtures: readonly FixtureView[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {props.fixtures.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fixtures.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Opponent</TableHead>
                <TableHead className="text-right">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.fixtures.map((fixture) => (
                <TableRow key={fixture.id}>
                  <TableCell>{fixtureDate(fixture)}</TableCell>
                  <TableCell>
                    <Link
                      to="/fixtures/$fixtureId"
                      params={{ fixtureId: fixture.id }}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {fixture.isHome ? "vs" : "at"} {opponentOf(fixture)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div className="flex flex-col items-end gap-1">
                      <span>{resultOf(fixture)}</span>
                      {fixture.homeScore !== null &&
                        fixture.awayScore !== null && (
                          <Link
                            to="/fixtures/$fixtureId"
                            params={{ fixtureId: fixture.id }}
                            hash="report"
                            className="text-xs underline underline-offset-2 hover:text-muted-foreground"
                          >
                            Report
                          </Link>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
