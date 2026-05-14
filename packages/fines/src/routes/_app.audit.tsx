import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { api, formatCents, type AuditEntry, type Member } from "../lib/api";

export const Route = createFileRoute("/_app/audit")({
  component: Audit,
});

const KIND_ORDER = [
  "all",
  "issued",
  "paid",
  "doubled",
  "forgiven",
  "adjusted",
] as const;

function Audit() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [kind, setKind] = useState<(typeof KIND_ORDER)[number]>("all");

  useEffect(() => {
    Promise.all([api.listAudit(200), api.listMembers()])
      .then(([a, m]) => {
        setEntries(a);
        setMembers(m);
        return null;
      })
      .catch((cause) => setErr(String(cause)));
  }, []);

  const membersById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );
  const membersByUserId = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members],
  );

  const filtered = useMemo(
    () =>
      (entries ?? []).filter((e) => kind === "all" || e.event.kind === kind),
    [entries, kind],
  );

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header>
        <h1>Audit</h1>
        <p className="muted">Every fine event in one place.</p>
      </header>
      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

      <section className="panel stack">
        <div className="row">
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              className={kind === k ? "primary" : ""}
              onClick={() => setKind(k)}
            >
              {k}
            </button>
          ))}
        </div>

        {entries === null ? (
          <p className="muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="muted">No events.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Player</th>
                <th>Event</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Δ</th>
                <th>Actor</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ event, fine }) => (
                <tr key={event.id}>
                  <td className="muted">
                    {new Date(event.at).toLocaleString()}
                  </td>
                  <td>{membersById.get(fine.memberId)?.name ?? "—"}</td>
                  <td>
                    <span
                      className={`badge ${
                        event.kind === "paid"
                          ? "paid"
                          : event.kind === "issued"
                            ? "unpaid"
                            : event.kind === "doubled"
                              ? "overdue"
                              : "forgiven"
                      }`}
                    >
                      {event.kind}
                    </span>
                  </td>
                  <td>{fine.reason}</td>
                  <td>{formatCents(event.amountCents)}</td>
                  <td
                    style={{
                      color:
                        event.deltaCents > 0
                          ? "var(--warn)"
                          : event.deltaCents < 0
                            ? "var(--success)"
                            : undefined,
                    }}
                  >
                    {event.deltaCents > 0 ? "+" : ""}
                    {formatCents(event.deltaCents)}
                  </td>
                  <td>
                    {event.actorUserId
                      ? (membersByUserId.get(event.actorUserId)?.name ?? "—")
                      : "system"}
                  </td>
                  <td className="muted">{event.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
