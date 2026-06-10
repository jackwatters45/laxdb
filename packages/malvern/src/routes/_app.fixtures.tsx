import { DisplayDateFromDate } from "@laxdb/core/schema";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { useEffect, useState } from "react";

import {
  listFixtures,
  listTeams,
  type FixtureView,
  type TeamView,
} from "../lib/malvern";

const formatDate = (value: Date | string | number | null) => {
  if (value === null) return "TBC";
  return Schema.decodeSync(DisplayDateFromDate)(new Date(value));
};

export const Route = createFileRoute("/_app/fixtures")({
  component: Fixtures,
});

function Fixtures() {
  const [teams, setTeams] = useState<readonly TeamView[]>([]);
  const [teamPublicId, setTeamPublicId] = useState("");
  const [fixtures, setFixtures] = useState<readonly FixtureView[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listTeams()
      .then((rows) => {
        setTeams(rows);
        setTeamPublicId(rows[0]?.publicId ?? "");
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  }, []);

  useEffect(() => {
    if (teamPublicId === "") return;
    listFixtures({ data: { teamPublicId } })
      .then((rows) => {
        setFixtures(rows);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  }, [teamPublicId]);

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header>
        <h1>Fixtures</h1>
        <p className="muted">
          Synced from Lacrosse Victoria / GameDay team fixture pages.
        </p>
      </header>

      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Season fixture</h2>
          <select
            value={teamPublicId}
            onChange={(event) => {
              setTeamPublicId(event.currentTarget.value);
            }}
          >
            {teams.map((team) => (
              <option key={team.publicId} value={team.publicId}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {fixtures.length === 0 ? (
          <p className="muted">No fixtures synced yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Round</th>
                <th>Date</th>
                <th>Opponent</th>
                <th>Venue</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((fixture) => (
                <tr key={fixture.publicId}>
                  <td>{fixture.roundLabel}</td>
                  <td>{formatDate(fixture.startsAt)}</td>
                  <td>{fixture.opponent}</td>
                  <td className="muted">{fixture.venue ?? "TBC"}</td>
                  <td>
                    {fixture.malvernScore === null ||
                    fixture.opponentScore === null
                      ? "—"
                      : `${fixture.malvernScore}–${fixture.opponentScore}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
