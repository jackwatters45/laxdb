import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { listMembers, type Member } from "../lib/fines";
import {
  assignCoach,
  createPlayer,
  createTeam,
  listCoaches,
  listFixtures,
  listPlayers,
  listTeams,
  syncFixtures,
  updateTeam,
  type CoachView,
  type FixtureView,
  type PlayerView,
  type TeamView,
} from "../lib/malvern";

const DEFAULT_GAMEDAY_URL =
  "https://websites.mygameday.app/team_info.cgi?c=0-1064-96353-658036-27270385&a=SFIX";

export const Route = createFileRoute("/_app/game-day-admin")({
  beforeLoad: ({ context }) => {
    if (
      context.me?.memberRole !== "owner" &&
      context.me?.memberRole !== "admin"
    ) {
      throw redirect({ to: "/top-three" });
    }
  },
  component: GameDayAdmin,
});

function GameDayAdmin() {
  const [teams, setTeams] = useState<readonly TeamView[]>([]);
  const [members, setMembers] = useState<readonly Member[]>([]);
  const [teamPublicId, setTeamPublicId] = useState("");
  const [players, setPlayers] = useState<readonly PlayerView[]>([]);
  const [coaches, setCoaches] = useState<readonly CoachView[]>([]);
  const [fixtures, setFixtures] = useState<readonly FixtureView[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.publicId === teamPublicId) ?? null,
    [teamPublicId, teams],
  );

  const loadTeams = () => {
    Promise.all([listTeams(), listMembers()])
      .then(([teamRows, memberRows]) => {
        setTeams(teamRows);
        setMembers(memberRows);
        setTeamPublicId((current) => current || (teamRows[0]?.publicId ?? ""));
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  };

  const loadTeamDetails = (publicId: string) => {
    if (publicId === "") return;
    Promise.all([
      listPlayers({ data: { teamPublicId: publicId } }),
      listCoaches({ data: { teamPublicId: publicId } }),
      listFixtures({ data: { teamPublicId: publicId } }),
    ])
      .then(([playerRows, coachRows, fixtureRows]) => {
        setPlayers(playerRows);
        setCoaches(coachRows);
        setFixtures(fixtureRows);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  };

  useEffect(loadTeams, []);

  useEffect(() => {
    loadTeamDetails(teamPublicId);
  }, [teamPublicId]);

  const onDone = (message: string) => {
    setNotice(message);
    setErr(null);
    loadTeams();
    loadTeamDetails(teamPublicId);
  };

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header>
        <h1>Game Day Admin</h1>
        <p className="muted">
          Configure Malvern teams, coaches, rosters, recipient lists, and
          Lacrosse Victoria fixture sync.
        </p>
      </header>

      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}
      {notice && <div className="panel">{notice}</div>}

      <CreateTeamForm onDone={onDone} onError={setErr} />

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Team setup</h2>
          <select
            value={teamPublicId}
            onChange={(event) => {
              setTeamPublicId(event.currentTarget.value);
            }}
          >
            <option value="">— team —</option>
            {teams.map((team) => (
              <option key={team.publicId} value={team.publicId}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTeam === null ? (
          <p className="muted">Create a team to start.</p>
        ) : (
          <>
            <TeamSettingsForm
              team={selectedTeam}
              onDone={onDone}
              onError={setErr}
            />
            <SyncFixturesPanel
              team={selectedTeam}
              fixtureCount={fixtures.length}
              onDone={onDone}
              onError={setErr}
            />
            <AssignCoachForm
              team={selectedTeam}
              members={members}
              coaches={coaches}
              onDone={onDone}
              onError={setErr}
            />
            <RosterForm
              team={selectedTeam}
              players={players}
              onDone={onDone}
              onError={setErr}
            />
          </>
        )}
      </section>
    </div>
  );
}

function CreateTeamForm({
  onDone,
  onError,
}: {
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("Malvern Lacrosse Club");
  const [grade, setGrade] = useState("Men's State League");
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_GAMEDAY_URL);
  const [recipients, setRecipients] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createTeam({
        data: {
          name: name.trim(),
          grade: grade.trim() || null,
          sourceUrl: sourceUrl.trim() || null,
          defaultRecipientEmails: parseRecipients(recipients),
        },
      });
      onDone("Team created.");
    } catch (cause) {
      onError(String(cause));
    }
  };

  return (
    <section className="panel stack">
      <h2>Create team</h2>
      <form className="stack" onSubmit={submit}>
        <div className="grid two">
          <input
            value={name}
            onChange={(event) => {
              setName(event.currentTarget.value);
            }}
            placeholder="Team name"
          />
          <input
            value={grade}
            onChange={(event) => {
              setGrade(event.currentTarget.value);
            }}
            placeholder="Grade / competition"
          />
        </div>
        <input
          value={sourceUrl}
          onChange={(event) => {
            setSourceUrl(event.currentTarget.value);
          }}
          placeholder="Lacrosse Victoria / GameDay fixture URL"
        />
        <textarea
          value={recipients}
          onChange={(event) => {
            setRecipients(event.currentTarget.value);
          }}
          placeholder="Default recipient emails, comma separated"
          rows={2}
        />
        <button className="primary" type="submit">
          Create team
        </button>
      </form>
    </section>
  );
}

function TeamSettingsForm({
  team,
  onDone,
  onError,
}: {
  team: TeamView;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [sourceUrl, setSourceUrl] = useState(team.sourceUrl ?? "");
  const [recipients, setRecipients] = useState(
    team.defaultRecipientEmails.join(", "),
  );

  useEffect(() => {
    setSourceUrl(team.sourceUrl ?? "");
    setRecipients(team.defaultRecipientEmails.join(", "));
  }, [team]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateTeam({
        data: {
          teamPublicId: team.publicId,
          sourceUrl: sourceUrl.trim() || null,
          defaultRecipientEmails: parseRecipients(recipients),
        },
      });
      onDone("Team settings saved.");
    } catch (cause) {
      onError(String(cause));
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <h3>Fixture source and recipients</h3>
      <input
        value={sourceUrl}
        onChange={(event) => {
          setSourceUrl(event.currentTarget.value);
        }}
        placeholder="GameDay season fixture URL"
      />
      <textarea
        value={recipients}
        onChange={(event) => {
          setRecipients(event.currentTarget.value);
        }}
        placeholder="Default recipient emails"
        rows={2}
      />
      <button type="submit">Save settings</button>
    </form>
  );
}

function SyncFixturesPanel({
  team,
  fixtureCount,
  onDone,
  onError,
}: {
  team: TeamView;
  fixtureCount: number;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const sync = async () => {
    setBusy(true);
    try {
      const result = await syncFixtures({
        data: { teamPublicId: team.publicId, sourceUrl: team.sourceUrl },
      });
      onDone(`Imported ${result.imported} fixtures.`);
    } catch (cause) {
      onError(String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <h3>Lacrosse Victoria fixtures</h3>
      <p className="muted">{fixtureCount} fixtures currently stored.</p>
      <button className="primary" onClick={sync} disabled={busy}>
        {busy ? "Syncing…" : "Sync fixtures"}
      </button>
    </div>
  );
}

function AssignCoachForm({
  team,
  members,
  coaches,
  onDone,
  onError,
}: {
  team: TeamView;
  members: readonly Member[];
  coaches: readonly CoachView[];
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [coachUserId, setCoachUserId] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (coachUserId === "") return;
    try {
      await assignCoach({ data: { teamPublicId: team.publicId, coachUserId } });
      setCoachUserId("");
      onDone("Coach assigned.");
    } catch (cause) {
      onError(String(cause));
    }
  };

  return (
    <div className="stack">
      <h3>Coaches</h3>
      {coaches.length === 0 ? (
        <p className="muted">No coaches assigned yet.</p>
      ) : (
        <ul>
          {coaches.map((coach) => (
            <li key={coach.publicId}>
              {coach.coachName} · {coach.coachEmail}
            </li>
          ))}
        </ul>
      )}
      <form className="row" onSubmit={submit}>
        <select
          value={coachUserId}
          onChange={(event) => {
            setCoachUserId(event.currentTarget.value);
          }}
          style={{ flex: 1 }}
        >
          <option value="">— member —</option>
          {members.map((member) => (
            <option key={member.id} value={member.userId}>
              {member.name} · {member.email}
            </option>
          ))}
        </select>
        <button type="submit">Assign coach</button>
      </form>
    </div>
  );
}

function RosterForm({
  team,
  players,
  onDone,
  onError,
}: {
  team: TeamView;
  players: readonly PlayerView[];
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [jumperNumber, setJumperNumber] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim() === "") return;
    try {
      await createPlayer({
        data: {
          teamPublicId: team.publicId,
          name: name.trim(),
          jumperNumber:
            jumperNumber.trim() === "" ? null : Number(jumperNumber.trim()),
        },
      });
      setName("");
      setJumperNumber("");
      onDone("Player added.");
    } catch (cause) {
      onError(String(cause));
    }
  };

  return (
    <div className="stack">
      <h3>Roster</h3>
      <form className="row" onSubmit={submit}>
        <input
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value);
          }}
          placeholder="Player name"
          style={{ flex: 2 }}
        />
        <input
          value={jumperNumber}
          onChange={(event) => {
            setJumperNumber(event.currentTarget.value);
          }}
          placeholder="#"
          type="number"
          style={{ flex: 1 }}
        />
        <button type="submit">Add player</button>
      </form>
      {players.length === 0 ? (
        <p className="muted">No players yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.publicId}>
                <td>{player.jumperNumber ?? "—"}</td>
                <td>{player.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const parseRecipients = (value: string) =>
  value
    .split(/[\n,;]/u)
    .map((email) => email.trim())
    .filter(Boolean);
