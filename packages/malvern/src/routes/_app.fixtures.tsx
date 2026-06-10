import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { listTeams, type TeamView } from "../lib/club";
import {
  listFixtures,
  listReports,
  syncFixtures,
  type FixtureView,
  type MatchReportView,
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

function Fixtures() {
  const [teams, setTeams] = useState<readonly TeamView[]>([]);
  const [teamId, setTeamId] = useState("");
  const [fixtures, setFixtures] = useState<readonly FixtureView[] | null>(null);
  const [reports, setReports] = useState<readonly MatchReportView[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    listTeams()
      .then((loaded) => {
        setTeams(loaded);
        if (loaded.length > 0 && loaded[0]) setTeamId(loaded[0].id);
        else setFixtures([]);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  }, []);

  const loadFixtures = (id: string) => {
    Promise.all([
      listFixtures({ data: { teamId: id } }),
      listReports({ data: { teamId: id } }),
    ])
      .then(([f, r]) => {
        setFixtures(f);
        setReports(r);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  };

  useEffect(() => {
    if (teamId) loadFixtures(teamId);
  }, [teamId]);

  const reportByFixture = useMemo(
    () => new Map(reports.map((report) => [report.fixtureId, report])),
    [reports],
  );

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

  const sync = async () => {
    if (!teamId) return;
    setSyncing(true);
    setSyncMsg(null);
    setErr(null);
    try {
      const result = await syncFixtures({ data: { teamId } });
      setSyncMsg(
        `Synced ${result.synced} fixtures${result.compName ? ` from ${result.compName}` : ""}.`,
      );
      loadFixtures(teamId);
    } catch (cause) {
      setErr(String(cause));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Fixtures</h1>
          <p className="muted">
            Pulled from Lacrosse Victoria (GameDay). Submit your top three after
            each game.
          </p>
        </div>
        <div className="row" style={{ gap: "0.5rem" }}>
          {teams.length > 1 && (
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.currentTarget.value);
              }}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
          {teamId && (
            <button
              onClick={() => {
                void sync();
              }}
              disabled={syncing}
            >
              {syncing ? "Syncing…" : "Sync fixtures"}
            </button>
          )}
        </div>
      </header>

      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}
      {syncMsg && <div className="panel muted">{syncMsg}</div>}

      {teams.length === 0 && fixtures !== null && (
        <section className="panel stack">
          <p className="muted">
            No teams set up yet. An admin needs to create your team (and its
            GameDay competition) under Admin.
          </p>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="panel stack">
          <h2>Upcoming</h2>
          <table>
            <thead>
              <tr>
                <th>Rd</th>
                <th>When</th>
                <th>Opponent</th>
                <th>Venue</th>
                <th>H/A</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((fixture) => (
                <tr key={fixture.id}>
                  <td>{fixture.round ?? "—"}</td>
                  <td>{formatKickoff(fixture)}</td>
                  <td>{opponentOf(fixture)}</td>
                  <td className="muted">{fixture.venueName ?? "TBC"}</td>
                  <td>{fixture.isHome ? "Home" : "Away"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="panel stack">
        <h2>Played</h2>
        {fixtures === null ? (
          <p className="muted">Loading…</p>
        ) : played.length === 0 ? (
          <p className="muted">
            No past fixtures yet. Use “Sync fixtures” to pull the season from
            GameDay.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rd</th>
                <th>When</th>
                <th>Opponent</th>
                <th>Result</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {played.map((fixture) => {
                const report = reportByFixture.get(fixture.id);
                return (
                  <tr key={fixture.id}>
                    <td>{fixture.round ?? "—"}</td>
                    <td className="muted">{formatKickoff(fixture)}</td>
                    <td>{opponentOf(fixture)}</td>
                    <td>{resultOf(fixture) ?? "—"}</td>
                    <td>
                      {report?.sentAt ? (
                        <span className="badge paid">sent</span>
                      ) : report ? (
                        <Link
                          to="/report/$fixtureId"
                          params={{ fixtureId: fixture.id }}
                        >
                          draft — finish
                        </Link>
                      ) : (
                        <Link
                          to="/report/$fixtureId"
                          params={{ fixtureId: fixture.id }}
                        >
                          submit
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
