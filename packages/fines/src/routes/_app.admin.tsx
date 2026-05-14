import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { api, formatCents, type FineTemplate, type Member } from "../lib/api";
import { authClient } from "../lib/auth-client";

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
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<FineTemplate[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    Promise.all([api.listMembers(), api.listTemplates()])
      .then(([m, t]) => {
        setMembers(m);
        setTemplates(t);
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
        <p className="muted">Invite players, manage templates, issue fines.</p>
      </header>
      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

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
  members: Member[];
  templates: FineTemplate[];
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
      await api.issueFine({
        memberId,
        templateId: templateId || null,
        reason: reason || null,
        ...(amount ? { amountCents: Math.round(Number(amount) * 100) } : {}),
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
  members: Member[];
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
  templates: FineTemplate[];
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
            api
              .createTemplate({
                label: label.trim(),
                amountCents: Math.round(Number(amount) * 100),
              })
              .then(() => {
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
                        onChange(() => api.deleteTemplate(t.id));
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
