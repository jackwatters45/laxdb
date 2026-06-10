import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  addRosterPlayer,
  listRoster,
  listTeams,
  removeRosterPlayer,
  updateRosterPlayer,
  type RosterPlayerView,
  type TeamView,
} from "../lib/club";

export const Route = createFileRoute("/_app/roster")({
  component: Roster,
});

function Roster() {
  const [teams, setTeams] = useState<readonly TeamView[]>([]);
  const [teamId, setTeamId] = useState("");
  const [roster, setRoster] = useState<readonly RosterPlayerView[] | null>(
    null,
  );
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");

  useEffect(() => {
    listTeams()
      .then((loaded) => {
        setTeams(loaded);
        if (loaded.length > 0 && loaded[0]) setTeamId(loaded[0].id);
        else setRoster([]);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  }, []);

  const load = (id: string) => {
    listRoster({ data: { teamId: id } })
      .then((players) => {
        setRoster(players);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  };

  useEffect(() => {
    if (teamId) load(teamId);
  }, [teamId]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !teamId) return;
    try {
      await addRosterPlayer({
        data: {
          teamId,
          name: name.trim(),
          jerseyNumber: jersey === "" ? null : Number(jersey),
        },
      });
      setName("");
      setJersey("");
      load(teamId);
    } catch (cause) {
      setErr(String(cause));
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      load(teamId);
    } catch (cause) {
      setErr(String(cause));
    }
  };

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Roster</h1>
          <p className="muted">
            Players available when submitting match reports.
          </p>
        </div>
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
      </header>

      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

      {teams.length === 0 && roster !== null ? (
        <section className="panel stack">
          <p className="muted">
            No teams set up yet. An admin needs to create your team under Admin.
          </p>
        </section>
      ) : (
        <section className="panel stack">
          <form className="row" onSubmit={add}>
            <input
              placeholder="Player name"
              value={name}
              onChange={(e) => {
                setName(e.currentTarget.value);
              }}
              style={{ flex: 2 }}
            />
            <input
              type="number"
              min="0"
              placeholder="#"
              value={jersey}
              onChange={(e) => {
                setJersey(e.currentTarget.value);
              }}
              style={{ flex: 1 }}
            />
            <button className="primary" type="submit">
              Add player
            </button>
          </form>

          {roster === null ? (
            <p className="muted">Loading…</p>
          ) : roster.length === 0 ? (
            <p className="muted">No players yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {roster.map((player) => (
                  <tr key={player.id}>
                    <td>{player.jerseyNumber ?? "—"}</td>
                    <td className={player.active ? "" : "muted"}>
                      {player.name}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          void act(() =>
                            updateRosterPlayer({
                              data: { id: player.id, active: !player.active },
                            }),
                          );
                        }}
                      >
                        {player.active ? "active" : "inactive"}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="danger"
                        onClick={() => {
                          if (confirm(`Remove ${player.name}?`)) {
                            void act(() =>
                              removeRosterPlayer({ data: { id: player.id } }),
                            );
                          }
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
