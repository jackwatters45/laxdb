import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { listTeams } from "../lib/club";
import {
  listFixtures,
  listReports,
  syncFixtures,
  type FixtureView,
} from "../lib/matches";

export const Route = createFileRoute("/_app/fixtures")({
  component: Fixtures,
});

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

function Fixtures() {
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });
  const teams = teamsQuery.data ?? [];
  const teamId = selectedTeamId !== "" ? selectedTeamId : (teams[0]?.id ?? "");

  const fixturesQuery = useQuery({
    queryKey: ["fixtures", teamId],
    queryFn: () => listFixtures({ data: { teamId } }),
    enabled: teamId !== "",
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", teamId],
    queryFn: () => listReports({ data: { teamId } }),
    enabled: teamId !== "",
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => syncFixtures({ data: { teamId: id } }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fixtures", teamId] }),
        queryClient.invalidateQueries({ queryKey: ["reports", teamId] }),
      ]),
  });

  const err =
    teamsQuery.error ??
    fixturesQuery.error ??
    reportsQuery.error ??
    syncMutation.error;

  const syncResult = syncMutation.isPending ? undefined : syncMutation.data;
  const syncMsg = syncResult
    ? `Synced ${syncResult.synced} fixtures${syncResult.compName ? ` from ${syncResult.compName}` : ""}.`
    : null;

  const reports = reportsQuery.data ?? [];
  const reportByFixture = useMemo(
    () => new Map(reports.map((report) => [report.fixtureId, report])),
    [reports],
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
    teamsQuery.isPending || (teamId !== "" && fixturesQuery.isPending);

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
          {teams.length > 1 && (
            <Select
              items={teams.map((team) => ({
                value: team.id,
                label: team.name,
              }))}
              value={teamId}
              onValueChange={(value) => {
                if (value !== null) setSelectedTeamId(value);
              }}
            >
              <SelectTrigger className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {teamId !== "" && (
            <Button
              onClick={() => {
                syncMutation.mutate(teamId);
              }}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? "Syncing…" : "Sync fixtures"}
            </Button>
          )}
        </div>
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}
      {syncMsg && (
        <Alert>
          <AlertDescription>{syncMsg}</AlertDescription>
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

      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rd</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>H/A</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((fixture) => (
                  <TableRow key={fixture.id}>
                    <TableCell>{fixture.round ?? "—"}</TableCell>
                    <TableCell>{formatKickoff(fixture)}</TableCell>
                    <TableCell>{opponentOf(fixture)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {fixture.venueName ?? "TBC"}
                    </TableCell>
                    <TableCell>{fixture.isHome ? "Home" : "Away"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              No past fixtures yet. Use “Sync fixtures” to pull the season from
              GameDay.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rd</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {played.map((fixture) => {
                  const report = reportByFixture.get(fixture.id);
                  return (
                    <TableRow key={fixture.id}>
                      <TableCell>{fixture.round ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatKickoff(fixture)}
                      </TableCell>
                      <TableCell>{opponentOf(fixture)}</TableCell>
                      <TableCell>{resultOf(fixture) ?? "—"}</TableCell>
                      <TableCell>
                        {report?.sentAt ? (
                          <Badge className="bg-success/15 text-success">
                            sent
                          </Badge>
                        ) : report ? (
                          <Link
                            to="/report/$fixtureId"
                            params={{ fixtureId: fixture.id }}
                            className={reportLinkClass}
                          >
                            draft — finish
                          </Link>
                        ) : (
                          <Link
                            to="/report/$fixtureId"
                            params={{ fixtureId: fixture.id }}
                            className={reportLinkClass}
                          >
                            submit
                          </Link>
                        )}
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
