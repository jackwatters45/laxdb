import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
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
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { listTeams } from "../../lib/club";
import { listFixtures, listReports, type FixtureView } from "../../lib/matches";

export const Route = createFileRoute("/_app/reports")({ component: Reports });

const ALL_TEAMS = "__all";
const MY_TEAMS = "__mine";

const fixtureLabel = (fixture: FixtureView) => {
  const opponent = fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;
  return `${fixture.isHome ? "vs" : "at"} ${opponent}`;
};

const fixtureDate = (fixture: FixtureView) =>
  fixture.scheduledAt === null
    ? "Date TBC"
    : new Date(fixture.scheduledAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

const uniqueById = <T extends { readonly id: string }>(items: readonly T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

function Reports() {
  const ctx = Route.useRouteContext();
  const [selectedFilter, setSelectedFilter] = useState(
    ctx.isAdmin ? ALL_TEAMS : MY_TEAMS,
  );
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });
  const teams = teamsQuery.data ?? [];
  const activeMemberId = ctx.me?.activeMemberId ?? null;
  const myTeams = useMemo(
    () =>
      activeMemberId === null
        ? []
        : teams.filter((team) => team.coachMemberId === activeMemberId),
    [activeMemberId, teams],
  );
  const effectiveFilter =
    !ctx.isAdmin && selectedFilter === ALL_TEAMS ? MY_TEAMS : selectedFilter;
  const selectedTeamIds = useMemo(() => {
    if (effectiveFilter === ALL_TEAMS) return teams.map((team) => team.id);
    if (effectiveFilter === MY_TEAMS) return myTeams.map((team) => team.id);
    return [effectiveFilter];
  }, [effectiveFilter, myTeams, teams]);

  const fixturesQuery = useQuery({
    queryKey: ["fixtures", "reports-page", effectiveFilter, selectedTeamIds],
    queryFn: async () => {
      if (effectiveFilter === ALL_TEAMS) return listFixtures({ data: {} });
      return uniqueById(
        (
          await Promise.all(
            selectedTeamIds.map((teamId) => listFixtures({ data: { teamId } })),
          )
        ).flat(),
      );
    },
    enabled:
      effectiveFilter === ALL_TEAMS ||
      (teamsQuery.isSuccess && selectedTeamIds.length > 0),
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", "reports-page", effectiveFilter, selectedTeamIds],
    queryFn: async () => {
      if (effectiveFilter === ALL_TEAMS) return listReports({ data: {} });
      return uniqueById(
        (
          await Promise.all(
            selectedTeamIds.map((teamId) => listReports({ data: { teamId } })),
          )
        ).flat(),
      );
    },
    enabled:
      effectiveFilter === ALL_TEAMS ||
      (teamsQuery.isSuccess && selectedTeamIds.length > 0),
  });

  const fixturesById = useMemo(
    () =>
      new Map(
        (fixturesQuery.data ?? []).map((fixture) => [fixture.id, fixture]),
      ),
    [fixturesQuery.data],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );
  const reports = useMemo(
    () =>
      [...(reportsQuery.data ?? [])].toSorted(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime(),
      ),
    [reportsQuery.data],
  );
  const error = teamsQuery.error ?? fixturesQuery.error ?? reportsQuery.error;
  const loading =
    teamsQuery.isPending || fixturesQuery.isPending || reportsQuery.isPending;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-semibold">
            Submitted reports
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            Review every submitted match report and reopen it for edits.
          </p>
        </div>
        {teams.length > 0 && (
          <Select
            items={[
              ...(ctx.isAdmin
                ? [{ value: ALL_TEAMS, label: "All teams" }]
                : []),
              ...(myTeams.length > 0
                ? [{ value: MY_TEAMS, label: "My teams" }]
                : []),
              ...(ctx.isAdmin ? teams : myTeams).map((team) => ({
                value: team.id,
                label: team.name,
              })),
            ]}
            value={effectiveFilter}
            onValueChange={(value) => {
              if (value !== null) setSelectedFilter(value);
            }}
          >
            <SelectTrigger className="min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ctx.isAdmin && (
                <SelectItem value={ALL_TEAMS}>All teams</SelectItem>
              )}
              {myTeams.length > 0 && (
                <SelectItem value={MY_TEAMS}>My teams</SelectItem>
              )}
              {(ctx.isAdmin ? teams : myTeams).map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Spinner /> Loading reports…
            </p>
          ) : reports.length === 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>No reports have been submitted for these teams.</p>
              <Link
                to="/fixtures"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Go to played fixtures to submit one.
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const fixture = fixturesById.get(report.fixtureId);
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Link
                          to="/teams/$teamId"
                          params={{ teamId: report.teamId }}
                          className="underline underline-offset-2 hover:text-muted-foreground"
                        >
                          {teamsById.get(report.teamId) ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {fixture === undefined ? (
                          "Fixture unavailable"
                        ) : (
                          <div className="space-y-0.5">
                            <div>{fixtureLabel(fixture)}</div>
                            <div className="text-xs text-muted-foreground">
                              {fixtureDate(fixture)}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-80">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {report.blurb ?? "No match notes added."}
                        </p>
                      </TableCell>
                      <TableCell>
                        {report.sentAt === null ? (
                          <Badge variant="outline">Saved only</Badge>
                        ) : (
                          <Badge variant="secondary">
                            Emailed to {report.sentTo.length}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to="/fixtures/$fixtureId"
                          params={{ fixtureId: report.fixtureId }}
                          hash="report"
                          className="text-sm underline underline-offset-2 hover:text-muted-foreground"
                        >
                          View · edit
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
