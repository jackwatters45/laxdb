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
import {
  listFixtures,
  listReports,
  type FixtureView,
  type MatchReportView,
} from "../../lib/matches";

export const Route = createFileRoute("/_app/fixtures")({
  component: Fixtures,
});

const ALL_TEAMS_FILTER = "__all";
const MY_TEAMS_FILTER = "__mine";
type FixtureFilter = string;

const formatKickoff = (fixture: FixtureView) =>
  fixture.scheduledAt === null
    ? "TBC"
    : new Date(fixture.scheduledAt).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });

const opponentOf = (fixture: FixtureView) =>
  fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;

const resultOf = (fixture: FixtureView) => {
  if (fixture.homeScore === null || fixture.awayScore === null) return null;
  const ours = fixture.isHome ? fixture.homeScore : fixture.awayScore;
  const theirs = fixture.isHome ? fixture.awayScore : fixture.homeScore;
  const outcome = ours > theirs ? "W" : ours < theirs ? "L" : "D";
  return `${outcome} ${ours}–${theirs}`;
};

const reportLinkClass =
  "underline underline-offset-2 hover:text-muted-foreground";

const uniqueById = <T extends { readonly id: string }>(items: readonly T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

function Fixtures() {
  const ctx = Route.useRouteContext();
  const [selectedFilter, setSelectedFilter] = useState(
    ctx.isAdmin ? ALL_TEAMS_FILTER : MY_TEAMS_FILTER,
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
    !ctx.isAdmin && selectedFilter === ALL_TEAMS_FILTER
      ? MY_TEAMS_FILTER
      : selectedFilter;
  const selectedTeamIds = useMemo(() => {
    if (effectiveFilter === ALL_TEAMS_FILTER)
      return teams.map((team) => team.id);
    if (effectiveFilter === MY_TEAMS_FILTER)
      return myTeams.map((team) => team.id);
    return [effectiveFilter];
  }, [effectiveFilter, myTeams, teams]);

  const fixturesQuery = useQuery({
    queryKey: ["fixtures", effectiveFilter, selectedTeamIds],
    queryFn: async () => {
      if (effectiveFilter === ALL_TEAMS_FILTER)
        return listFixtures({ data: {} });
      const fixtures = await Promise.all(
        selectedTeamIds.map((teamId) => listFixtures({ data: { teamId } })),
      );
      return uniqueById(fixtures.flat());
    },
    enabled:
      effectiveFilter === ALL_TEAMS_FILTER ||
      (teamsQuery.isSuccess && selectedTeamIds.length > 0),
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", effectiveFilter, selectedTeamIds],
    queryFn: async () => {
      if (effectiveFilter === ALL_TEAMS_FILTER)
        return listReports({ data: {} });
      const reports = await Promise.all(
        selectedTeamIds.map((teamId) => listReports({ data: { teamId } })),
      );
      return uniqueById(reports.flat());
    },
    enabled:
      effectiveFilter === ALL_TEAMS_FILTER ||
      (teamsQuery.isSuccess && selectedTeamIds.length > 0),
  });

  const err = teamsQuery.error ?? fixturesQuery.error ?? reportsQuery.error;

  const reports = reportsQuery.data ?? [];
  const reportByFixture = useMemo(
    () => new Map(reports.map((report) => [report.fixtureId, report])),
    [reports],
  );
  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );

  const fixtures = fixturesQuery.data;
  const now = Date.now();
  const { upcoming, played } = useMemo(() => {
    const all = fixtures ?? [];
    const upcomingList = all
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
    const playedList = all.filter(
      (fixture) =>
        fixture.scheduledAt === null ||
        new Date(fixture.scheduledAt).getTime() <= now,
    );
    return { upcoming: upcomingList, played: playedList };
  }, [fixtures, now]);

  const fixturesLoading =
    teamsQuery.isPending ||
    (selectedTeamIds.length > 0 && fixturesQuery.isPending);
  const showTeamColumn =
    effectiveFilter === ALL_TEAMS_FILTER || selectedTeamIds.length > 1;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Fixtures</h1>
          <p className="text-sm text-muted-foreground">
            Pulled from Lacrosse Victoria (GameDay). Submit your top three after
            each game.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <Select
              items={[
                ...(ctx.isAdmin
                  ? [{ value: ALL_TEAMS_FILTER, label: "All teams" }]
                  : []),
                ...(myTeams.length > 0
                  ? [{ value: MY_TEAMS_FILTER, label: "My teams" }]
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
                  <SelectItem value={ALL_TEAMS_FILTER}>All teams</SelectItem>
                )}
                {myTeams.length > 0 && (
                  <SelectItem value={MY_TEAMS_FILTER}>My teams</SelectItem>
                )}
                {(ctx.isAdmin ? teams : myTeams).map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}

      {teamsQuery.isSuccess && teams.length === 0 && (
        <Card size="sm">
          <CardContent className="text-muted-foreground">
            No teams set up yet. An admin needs to create your team (and its
            GameDay competition) under Admin.
          </CardContent>
        </Card>
      )}

      {teamsQuery.isSuccess &&
        effectiveFilter === MY_TEAMS_FILTER &&
        myTeams.length === 0 && (
          <Card size="sm">
            <CardContent className="text-muted-foreground">
              You are not assigned as coach of any teams yet. An admin can
              assign you under Admin → Teams.
            </CardContent>
          </Card>
        )}

      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <FixtureTable
              fixtures={upcoming}
              reportByFixture={reportByFixture}
              teamById={teamById}
              showReports={false}
              showTeamColumn={showTeamColumn}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Played</CardTitle>
        </CardHeader>
        <CardContent>
          {fixturesLoading ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Spinner />
              Loading…
            </p>
          ) : played.length === 0 ? (
            <p className="text-muted-foreground">
              No past fixtures yet. Ask an admin to sync Lacrosse Victoria and
              link your squad under Admin.
            </p>
          ) : (
            <FixtureTable
              fixtures={played}
              reportByFixture={reportByFixture}
              teamById={teamById}
              showReports
              showTeamColumn={showTeamColumn}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FixtureTable({
  fixtures,
  reportByFixture,
  teamById,
  showReports,
  showTeamColumn,
}: {
  fixtures: readonly FixtureView[];
  reportByFixture: ReadonlyMap<string, MatchReportView>;
  teamById: ReadonlyMap<string, string>;
  showReports: boolean;
  showTeamColumn: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showTeamColumn && <TableHead>Team</TableHead>}
          <TableHead>Rd</TableHead>
          <TableHead>When</TableHead>
          <TableHead>Opponent</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead>H/A</TableHead>
          {showReports && <TableHead>Report</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fixtures.map((fixture) => {
          const report = reportByFixture.get(fixture.id);
          const result = resultOf(fixture);
          return (
            <TableRow key={fixture.id}>
              {showTeamColumn && (
                <TableCell>{teamById.get(fixture.teamId) ?? "—"}</TableCell>
              )}
              <TableCell>{fixture.round ?? "—"}</TableCell>
              <TableCell>{formatKickoff(fixture)}</TableCell>
              <TableCell>{opponentOf(fixture)}</TableCell>
              <TableCell className="text-muted-foreground">
                {fixture.venueName ?? "TBC"}
              </TableCell>
              <TableCell>{fixture.isHome ? "Home" : "Away"}</TableCell>
              {showReports && (
                <TableCell>
                  {report ? (
                    <Link
                      to="/report/$fixtureId"
                      params={{ fixtureId: fixture.id }}
                      className={reportLinkClass}
                    >
                      <Badge variant="secondary">Submitted · edit</Badge>
                    </Link>
                  ) : result ? (
                    <Link
                      to="/report/$fixtureId"
                      params={{ fixtureId: fixture.id }}
                      className={reportLinkClass}
                    >
                      Submit report
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
