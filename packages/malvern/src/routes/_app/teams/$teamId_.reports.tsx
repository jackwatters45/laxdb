import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Card, CardContent } from "@laxdb/ui/components/ui/card";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo } from "react";

import { TeamPageHeader } from "../../../components/team-page-header";
import {
  listFixtures,
  listReports,
  type FixtureView,
} from "../../../lib/matches";

export const Route = createFileRoute("/_app/teams/$teamId_/reports")({
  beforeLoad: ({ context, params }) => {
    const team = context.teams.find((entry) => entry.id === params.teamId);
    const canView =
      context.isAdmin ||
      (context.me?.activeMemberId !== null &&
        team?.coachMemberId === context.me?.activeMemberId);
    if (!canView) throw redirect({ to: "/teams" });
  },
  component: TeamReportsPage,
});

const opponentOf = (fixture: FixtureView) =>
  fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;

function TeamReportsPage() {
  const { teamId } = Route.useParams();
  const ctx = Route.useRouteContext();
  const team = ctx.teams.find((entry) => entry.id === teamId);
  const fixturesQuery = useQuery({
    queryKey: ["fixtures", teamId],
    queryFn: () => listFixtures({ data: { teamId } }),
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", teamId],
    queryFn: () => listReports({ data: { teamId } }),
  });
  const fixturesById = useMemo(
    () =>
      new Map(
        (fixturesQuery.data ?? []).map((fixture) => [fixture.id, fixture]),
      ),
    [fixturesQuery.data],
  );
  const error = fixturesQuery.error ?? reportsQuery.error;
  const reports = reportsQuery.data ?? [];
  const submittedFixtureIds = new Set(
    reports.map((report) => report.fixtureId),
  );
  const awaitingReports = (fixturesQuery.data ?? [])
    .filter(
      (fixture) =>
        fixture.homeScore !== null &&
        fixture.awayScore !== null &&
        !submittedFixtureIds.has(fixture.id),
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
        title="Reports"
        description="Submitted match reports for this squad. Open a game to create or edit its report."
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {fixturesQuery.isPending || reportsQuery.isPending ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading reports…
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {awaitingReports.length > 0 && (
            <Card>
              <CardContent className="flex flex-col divide-y">
                {awaitingReports.map((fixture) => (
                  <div
                    key={fixture.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">
                        {fixture.isHome ? "vs" : "at"} {opponentOf(fixture)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Report not submitted
                      </p>
                    </div>
                    <Link
                      to="/teams/$teamId/fixtures/$fixtureId"
                      params={{ teamId: fixture.teamId, fixtureId: fixture.id }}
                      hash="report"
                      className="text-sm font-medium underline underline-offset-2 hover:text-muted-foreground"
                    >
                      Submit report
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="flex flex-col divide-y">
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No match reports have been submitted yet.
                </p>
              ) : (
                reports.map((report) => {
                  const fixture = fixturesById.get(report.fixtureId);
                  return (
                    <div
                      key={report.id}
                      className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="font-medium">
                          {fixture === undefined
                            ? "Fixture unavailable"
                            : `${fixture.isHome ? "vs" : "at"} ${opponentOf(fixture)}`}
                        </div>
                        <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                          {report.blurb ?? "No match notes added."}
                        </p>
                      </div>
                      <Link
                        to="/teams/$teamId/fixtures/$fixtureId"
                        params={{
                          teamId: report.teamId,
                          fixtureId: report.fixtureId,
                        }}
                        hash="report"
                        className="shrink-0 text-sm underline underline-offset-2 hover:text-muted-foreground"
                      >
                        View · edit report
                      </Link>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
