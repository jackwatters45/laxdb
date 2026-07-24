import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { TeamPageHeader } from "../../../components/team-page-header";
import { listRoster } from "../../../lib/club";
import {
  listFixtures,
  listMatchImages,
  listReports,
  syncFixtures,
  syncGamedayRoster,
  type FixtureView,
} from "../../../lib/matches";

export const Route = createFileRoute("/_app/teams/$teamId")({
  beforeLoad: ({ context, params }) => {
    const team = context.teams.find((entry) => entry.id === params.teamId);
    const canView =
      context.isAdmin ||
      (context.me?.activeMemberId !== null &&
        team?.coachMemberId === context.me?.activeMemberId);
    if (!canView) throw redirect({ to: "/teams" });
  },
  component: TeamOverviewPage,
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
  if (fixture.homeScore === null || fixture.awayScore === null) return null;
  const ours = fixture.isHome ? fixture.homeScore : fixture.awayScore;
  const theirs = fixture.isHome ? fixture.awayScore : fixture.homeScore;
  const outcome = ours > theirs ? "W" : ours < theirs ? "L" : "D";
  return `${outcome} ${ours}–${theirs}`;
};

function TeamOverviewPage() {
  const { teamId } = Route.useParams();
  const ctx = Route.useRouteContext();
  const queryClient = useQueryClient();
  const team = ctx.teams.find((entry) => entry.id === teamId);
  const fixturesQuery = useQuery({
    queryKey: ["fixtures", teamId],
    queryFn: () => listFixtures({ data: { teamId } }),
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", teamId],
    queryFn: () => listReports({ data: { teamId } }),
  });
  const imagesQuery = useQuery({
    queryKey: ["match-images", "team", teamId],
    queryFn: () => listMatchImages({ data: { teamId } }),
  });
  const rosterQuery = useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => listRoster({ data: { teamId } }),
  });
  const syncMutation = useMutation({
    mutationFn: async () => {
      const fixturesResult = await syncFixtures({ data: { teamId } });
      const rosterResult = await syncGamedayRoster({ data: { teamId } });
      return { fixturesResult, rosterResult };
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fixtures"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["team-standings", teamId] }),
        queryClient.invalidateQueries({ queryKey: ["team-summary", teamId] }),
        queryClient.invalidateQueries({
          queryKey: ["team-player-stats", teamId],
        }),
        queryClient.invalidateQueries({ queryKey: ["roster", teamId] }),
      ]),
  });

  if (team === undefined) {
    return (
      <Alert variant="destructive">
        <AlertDescription>That team is no longer available.</AlertDescription>
      </Alert>
    );
  }

  const fixtures = fixturesQuery.data ?? [];
  const reports = reportsQuery.data ?? [];
  const images = imagesQuery.data ?? [];
  const roster = (rosterQuery.data ?? []).filter((player) => player.active);
  const now = Date.now();
  const next = fixtures
    .filter(
      (fixture) =>
        fixture.scheduledAt !== null &&
        new Date(fixture.scheduledAt).getTime() > now,
    )
    .toSorted(
      (a, b) =>
        new Date(a.scheduledAt ?? 0).getTime() -
        new Date(b.scheduledAt ?? 0).getTime(),
    )[0];
  const previous = fixtures
    .filter(
      (fixture) =>
        fixture.scheduledAt !== null &&
        new Date(fixture.scheduledAt).getTime() <= now,
    )
    .toSorted(
      (a, b) =>
        new Date(b.scheduledAt ?? 0).getTime() -
        new Date(a.scheduledAt ?? 0).getTime(),
    )[0];
  const error =
    fixturesQuery.error ??
    reportsQuery.error ??
    imagesQuery.error ??
    rosterQuery.error ??
    syncMutation.error;
  const loading =
    fixturesQuery.isPending ||
    reportsQuery.isPending ||
    imagesQuery.isPending ||
    rosterQuery.isPending;

  return (
    <div className="flex flex-col gap-8">
      <TeamPageHeader
        teamId={teamId}
        teamName={team.name}
        description="The operational home for this squad. Open a section to manage fixtures, reports, photos, roster, standings, or stats."
        actions={
          ctx.isAdmin ? (
            <Button
              type="button"
              variant="outline"
              disabled={syncMutation.isPending}
              onClick={() => {
                syncMutation.mutate();
              }}
            >
              {syncMutation.isPending ? "Syncing GameDay…" : "Sync team"}
            </Button>
          ) : null
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {syncMutation.data && (
        <p className="text-sm text-muted-foreground">
          Synced {syncMutation.data.fixturesResult.synced} fixtures and fetched{" "}
          {syncMutation.data.rosterResult.fetched} roster players from GameDay.
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading {team.name}…
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FixtureSpotlight title="Next fixture" fixture={next} />
            <FixtureSpotlight title="Previous fixture" fixture={previous} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SectionCard
              to="/teams/$teamId/fixtures"
              teamId={teamId}
              title="Fixtures"
              description={`${fixtures.length} synced fixture${fixtures.length === 1 ? "" : "s"}`}
            />
            <SectionCard
              to="/teams/$teamId/reports"
              teamId={teamId}
              title="Reports"
              description={`${reports.length} submitted report${reports.length === 1 ? "" : "s"}`}
            />
            <SectionCard
              to="/teams/$teamId/photos"
              teamId={teamId}
              title="Photos"
              description={`${images.length} match photo${images.length === 1 ? "" : "s"}`}
            />
            <SectionCard
              to="/teams/$teamId/roster"
              teamId={teamId}
              title="Roster"
              description={`${roster.length} active player${roster.length === 1 ? "" : "s"}`}
            />
            <SectionCard
              to="/teams/$teamId/standings"
              teamId={teamId}
              title="Standings"
              description="Published competition ladder"
            />
            <SectionCard
              to="/teams/$teamId/stats"
              teamId={teamId}
              title="Statistics"
              description="Team record and player G/A/P"
            />
          </div>
        </>
      )}
    </div>
  );
}

function FixtureSpotlight(props: {
  readonly title: string;
  readonly fixture: FixtureView | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {props.fixture === undefined ? (
          <p className="text-sm text-muted-foreground">No fixture available.</p>
        ) : (
          <Link
            to="/fixtures/$fixtureId"
            params={{ fixtureId: props.fixture.id }}
            className="block space-y-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="font-medium underline-offset-4 hover:underline">
              {props.fixture.isHome ? "vs" : "at"} {opponentOf(props.fixture)}
            </div>
            <div className="text-sm text-muted-foreground">
              {fixtureDate(props.fixture)}
              {resultOf(props.fixture) === null
                ? ""
                : ` · ${resultOf(props.fixture)}`}
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function SectionCard(props: {
  readonly to:
    | "/teams/$teamId/fixtures"
    | "/teams/$teamId/reports"
    | "/teams/$teamId/photos"
    | "/teams/$teamId/roster"
    | "/teams/$teamId/standings"
    | "/teams/$teamId/stats";
  readonly teamId: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <Link to={props.to} params={{ teamId: props.teamId }}>
      <Card className="h-full transition-colors hover:bg-muted/35">
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
          <CardDescription>{props.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
