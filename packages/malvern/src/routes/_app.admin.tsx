import { DisplayCurrencyFromCents } from "@laxdb/core/schema";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Schema } from "effect";
import { useEffect, useState } from "react";

import { authClient } from "../lib/auth-client";
import {
  addRecipient,
  createTeam,
  deleteTeam,
  listRecipients,
  listTeams,
  removeRecipient,
  updateTeam,
  type RecipientView,
  type TeamView,
} from "../lib/club";
import {
  createTemplate,
  deleteTemplate,
  issueFine,
  listMembers,
  listTemplates,
  type FineTemplateView,
  type Member,
} from "../lib/fines";
import {
  listCompetitions,
  syncFixtures,
  type CompetitionView,
} from "../lib/matches";

const formatCents = Schema.decodeSync(DisplayCurrencyFromCents);

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: ({ context }) => {
    if (
      context.me?.memberRole !== "owner" &&
      context.me?.memberRole !== "admin"
    ) {
      throw redirect({ to: "/fines" });
    }
  },
  component: Admin,
});

function Admin() {
  const [members, setMembers] = useState<readonly Member[]>([]);
  const [templates, setTemplates] = useState<readonly FineTemplateView[]>([]);
  const [teams, setTeams] = useState<readonly TeamView[]>([]);
  const [recipients, setRecipients] = useState<readonly RecipientView[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    Promise.all([listMembers(), listTemplates(), listTeams(), listRecipients()])
      .then(([m, t, tm, r]) => {
        setMembers(m);
        setTemplates(t);
        setTeams(tm);
        setRecipients(r);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  };

  useEffect(load, []);

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      load();
    } catch (cause) {
      setErr(String(cause));
    }
  };

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header>
        <h1>Admin</h1>
        <p className="muted">
          Teams, report recipients, coaches, fines templates.
        </p>
      </header>
      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

      <Teams teams={teams} members={members} onChange={act} onError={setErr} />

      <Recipients teams={teams} recipients={recipients} onChange={act} />

      <IssueFine
        members={members}
        templates={templates}
        onDone={load}
        onError={setErr}
      />

      <Invite members={members} onChange={act} />

      <Templates templates={templates} onChange={act} />
    </div>
  );
}

function IssueFine({
  members,
  templates,
  onDone,
  onError,
}: {
  members: readonly Member[];
  templates: readonly FineTemplateView[];
  onDone: () => void;
  onError: (s: string) => void;
}) {
  const [memberId, setMemberId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!memberId) return;
    try {
      await issueFine({
        data: {
          memberId,
          templateId: templateId || null,
          reason: reason || null,
          ...(amount ? { amountCents: Math.round(Number(amount) * 100) } : {}),
        },
      });
      setReason("");
      setAmount("");
      setTemplateId("");
      onDone();
    } catch (cause) {
      onError(String(cause));
    }
  };

  return (
    <section className="panel stack">
      <h2>Issue Fine</h2>
      <form className="stack" onSubmit={submit}>
        <div className="row">
          <select
            value={memberId}
            onChange={(e) => {
              setMemberId(e.currentTarget.value);
            }}
            style={{ flex: 1 }}
          >
            <option value="">— player —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={templateId}
            onChange={(e) => {
              const selectedTemplate = templates.find(
                (template) => template.id === e.currentTarget.value,
              );
              setTemplateId(e.currentTarget.value);
              if (selectedTemplate) {
                setReason(selectedTemplate.label);
                setAmount((selectedTemplate.amountCents / 100).toString());
              }
            }}
            style={{ flex: 1 }}
          >
            <option value="">— template (optional) —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} · {formatCents(t.amountCents)}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <input
            placeholder="Reason"
            value={reason}
            onChange={(e) => {
              setReason(e.currentTarget.value);
            }}
            style={{ flex: 2 }}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount $"
            value={amount}
            onChange={(e) => {
              setAmount(e.currentTarget.value);
            }}
            style={{ flex: 1 }}
          />
          <button className="primary" type="submit">
            Issue
          </button>
        </div>
      </form>
    </section>
  );
}

function Invite({
  members,
  onChange,
}: {
  members: readonly Member[];
  onChange: (fn: () => Promise<unknown>) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setSent(null);
    try {
      await authClient.organization.inviteMember({
        email: email.trim(),
        role,
      });
      setSent(email.trim());
      setEmail("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel stack">
      <h2>Players</h2>
      <form className="row" onSubmit={send}>
        <input
          type="email"
          placeholder="player@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.currentTarget.value);
          }}
          style={{ flex: 1 }}
        />
        <select
          value={role}
          onChange={(e) => {
            const nextRole = e.currentTarget.value;
            if (nextRole === "member" || nextRole === "admin") {
              setRole(nextRole);
            }
          }}
        >
          <option value="member">player</option>
          <option value="admin">admin</option>
        </select>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Invite"}
        </button>
      </form>
      {sent && (
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Invite sent to <strong>{sent}</strong>. (Dev: check api worker logs.)
        </p>
      )}

      {members.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td className="muted">{m.email}</td>
                <td>{m.role}</td>
                <td style={{ textAlign: "right" }}>
                  {m.role !== "owner" && (
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm(`Remove ${m.name}?`))
                          onChange(() =>
                            authClient.organization.removeMember({
                              memberIdOrEmail: m.id,
                            }),
                          );
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Templates({
  templates,
  onChange,
}: {
  templates: readonly FineTemplateView[];
  onChange: (fn: () => Promise<unknown>) => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <section className="panel stack">
      <h2>Fine Templates</h2>
      <p className="muted" style={{ margin: 0 }}>
        Default fines for common offenses.
      </p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim() || !amount) return;
          onChange(() =>
            createTemplate({
              data: {
                label: label.trim(),
                amountCents: Math.round(Number(amount) * 100),
              },
            }).then(() => {
              setLabel("");
              setAmount("");
              return null;
            }),
          );
        }}
      >
        <input
          placeholder='e.g. "Late to practice"'
          value={label}
          onChange={(e) => {
            setLabel(e.currentTarget.value);
          }}
          style={{ flex: 2 }}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount $"
          value={amount}
          onChange={(e) => {
            setAmount(e.currentTarget.value);
          }}
          style={{ flex: 1 }}
        />
        <button className="primary" type="submit">
          Add
        </button>
      </form>

      {templates.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td>{t.label}</td>
                <td>{formatCents(t.amountCents)}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm(`Delete "${t.label}"?`))
                        onChange(() => deleteTemplate({ data: { id: t.id } }));
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
  );
}

function Teams({
  teams,
  members,
  onChange,
  onError,
}: {
  teams: readonly TeamView[];
  members: readonly Member[];
  onChange: (fn: () => Promise<unknown>) => void;
  onError: (s: string) => void;
}) {
  const [name, setName] = useState("");
  const [comps, setComps] = useState<readonly CompetitionView[] | null>(null);
  const [loadingComps, setLoadingComps] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const loadComps = async () => {
    setLoadingComps(true);
    try {
      setComps(await listCompetitions({ data: {} }));
    } catch (cause) {
      onError(String(cause));
    } finally {
      setLoadingComps(false);
    }
  };

  const sync = async (teamId: string) => {
    setSyncing(teamId);
    setSyncMsg(null);
    try {
      const result = await syncFixtures({ data: { teamId } });
      setSyncMsg(
        `Synced ${result.synced} fixtures${result.compName ? ` from ${result.compName}` : ""}.`,
      );
    } catch (cause) {
      onError(String(cause));
    } finally {
      setSyncing(null);
    }
  };

  return (
    <section className="panel stack">
      <h2>Teams</h2>
      <p className="muted" style={{ margin: 0 }}>
        Link each team to its Lacrosse Victoria competition on GameDay, assign a
        coach, then sync fixtures.
      </p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onChange(() =>
            createTeam({ data: { name: name.trim() } }).then(() => {
              setName("");
              return null;
            }),
          );
        }}
      >
        <input
          placeholder='e.g. "Malvern Men’s State League"'
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
          style={{ flex: 2 }}
        />
        <button className="primary" type="submit">
          Add team
        </button>
        <button
          type="button"
          onClick={() => {
            void loadComps();
          }}
          disabled={loadingComps}
        >
          {loadingComps ? "Loading…" : "Load GameDay comps"}
        </button>
      </form>

      {syncMsg && <p className="muted">{syncMsg}</p>}

      {teams.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>GameDay comp</th>
              <th>GameDay team id</th>
              <th>Coach</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                members={members}
                comps={comps}
                syncing={syncing === team.id}
                onSync={() => {
                  void sync(team.id);
                }}
                onChange={onChange}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TeamRow({
  team,
  members,
  comps,
  syncing,
  onSync,
  onChange,
}: {
  team: TeamView;
  members: readonly Member[];
  comps: readonly CompetitionView[] | null;
  syncing: boolean;
  onSync: () => void;
  onChange: (fn: () => Promise<unknown>) => void;
}) {
  const [gamedayTeamId, setGamedayTeamId] = useState(team.gamedayTeamId ?? "");

  return (
    <tr>
      <td>{team.name}</td>
      <td>
        {comps === null ? (
          <span className="muted">{team.gamedayCompId ?? "—"}</span>
        ) : (
          <select
            value={team.gamedayCompId ?? ""}
            onChange={(e) => {
              const compId = e.currentTarget.value || null;
              onChange(() =>
                updateTeam({ data: { id: team.id, gamedayCompId: compId } }),
              );
            }}
          >
            <option value="">— competition —</option>
            {comps.map((comp) => (
              <option key={comp.compId} value={comp.compId}>
                {comp.name}
              </option>
            ))}
          </select>
        )}
      </td>
      <td>
        <input
          placeholder="optional"
          value={gamedayTeamId}
          onChange={(e) => {
            setGamedayTeamId(e.currentTarget.value);
          }}
          onBlur={() => {
            if ((team.gamedayTeamId ?? "") !== gamedayTeamId.trim()) {
              onChange(() =>
                updateTeam({
                  data: {
                    id: team.id,
                    gamedayTeamId: gamedayTeamId.trim() || null,
                  },
                }),
              );
            }
          }}
          style={{ width: "8rem" }}
        />
      </td>
      <td>
        <select
          value={team.coachMemberId ?? ""}
          onChange={(e) => {
            const coachMemberId = e.currentTarget.value || null;
            onChange(() =>
              updateTeam({ data: { id: team.id, coachMemberId } }),
            );
          }}
        >
          <option value="">— coach —</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </td>
      <td style={{ textAlign: "right" }}>
        <button onClick={onSync} disabled={syncing || !team.gamedayCompId}>
          {syncing ? "Syncing…" : "Sync"}
        </button>{" "}
        <button
          className="danger"
          onClick={() => {
            if (confirm(`Delete ${team.name}? Fixtures go with it.`)) {
              onChange(() => deleteTeam({ data: { id: team.id } }));
            }
          }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

function Recipients({
  teams,
  recipients,
  onChange,
}: {
  teams: readonly TeamView[];
  recipients: readonly RecipientView[];
  onChange: (fn: () => Promise<unknown>) => void;
}) {
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("");

  const teamName = (id: string | null) =>
    id === null
      ? "All teams"
      : (teams.find((team) => team.id === id)?.name ?? "—");

  return (
    <section className="panel stack">
      <h2>Report recipients</h2>
      <p className="muted" style={{ margin: 0 }}>
        Who match reports get emailed to. Org-wide recipients apply to every
        team; team recipients only to theirs. Coaches choose from these when
        submitting.
      </p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim() || !email.trim()) return;
          onChange(() =>
            addRecipient({
              data: {
                label: label.trim(),
                email: email.trim(),
                teamId: teamId || null,
              },
            }).then(() => {
              setLabel("");
              setEmail("");
              setTeamId("");
              return null;
            }),
          );
        }}
      >
        <input
          placeholder='e.g. "Club secretary"'
          value={label}
          onChange={(e) => {
            setLabel(e.currentTarget.value);
          }}
          style={{ flex: 1 }}
        />
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.currentTarget.value);
          }}
          style={{ flex: 1 }}
        />
        <select
          value={teamId}
          onChange={(e) => {
            setTeamId(e.currentTarget.value);
          }}
        >
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <button className="primary" type="submit">
          Add
        </button>
      </form>

      {recipients.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Email</th>
              <th>Scope</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient) => (
              <tr key={recipient.id}>
                <td>{recipient.label}</td>
                <td className="muted">{recipient.email}</td>
                <td>{teamName(recipient.teamId)}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm(`Remove ${recipient.label}?`)) {
                        onChange(() =>
                          removeRecipient({ data: { id: recipient.id } }),
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
  );
}
