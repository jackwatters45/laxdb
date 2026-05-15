import {
  DisplayCurrencyFromCents,
  DisplayDateFromDate,
} from "@laxdb/core/schema";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { useEffect, useMemo, useState } from "react";

import {
  forgiveFine,
  listFines,
  listMembers,
  payFine,
  type FineView,
  type Member,
} from "../lib/fines";

const formatCents = Schema.decodeSync(DisplayCurrencyFromCents);
const formatDate = (value: Date | string | number) =>
  Schema.decodeSync(DisplayDateFromDate)(new Date(value));

export const Route = createFileRoute("/_app/fines")({
  component: Board,
});

type Row = {
  readonly id: string;
  readonly organizationId: string;
  readonly memberId: string;
  readonly templateId: string | null;
  readonly reason: string;
  readonly originalAmountCents: number;
  readonly amountCents: number;
  readonly status: FineView["status"];
  readonly issuedAt: Date;
  readonly dueAt: Date;
  readonly paidAt: Date | null;
  readonly issuedByUserId: string | null;
  readonly memberName: string;
};

function Board() {
  const { me } = Route.useRouteContext();
  const isAdmin = me?.memberRole === "owner" || me?.memberRole === "admin";

  const [fines, setFines] = useState<readonly FineView[] | null>(null);
  const [members, setMembers] = useState<readonly Member[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid" | "forgiven">(
    "unpaid",
  );

  const load = () => {
    Promise.all([listFines(), listMembers()])
      .then(([f, m]) => {
        setFines(f);
        setMembers(m);
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  };

  useEffect(load, []);

  const membersById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const rows: Row[] = useMemo(
    () =>
      (fines ?? [])
        .filter((f) => filter === "all" || f.status === filter)
        .map((f) => ({
          id: f.id,
          organizationId: f.organizationId,
          memberId: f.memberId,
          templateId: f.templateId,
          reason: f.reason,
          originalAmountCents: f.originalAmountCents,
          amountCents: f.amountCents,
          status: f.status,
          issuedAt: f.issuedAt,
          dueAt: f.dueAt,
          paidAt: f.paidAt,
          issuedByUserId: f.issuedByUserId,
          memberName: membersById.get(f.memberId)?.name ?? "Unknown",
        })),
    [fines, filter, membersById],
  );

  const totals = useMemo(() => {
    const unpaidByMember = new Map<string, number>();
    for (const f of fines ?? []) {
      if (f.status !== "unpaid") continue;
      unpaidByMember.set(
        f.memberId,
        (unpaidByMember.get(f.memberId) ?? 0) + f.amountCents,
      );
    }
    return [...unpaidByMember.entries()]
      .map(([mid, c]) => ({
        name: membersById.get(mid)?.name ?? "Unknown",
        cents: c,
      }))
      .toSorted((a, b) => b.cents - a.cents);
  }, [fines, membersById]);

  const now = Date.now();

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      load();
    } catch (e) {
      setErr(String(e));
    }
  };

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header>
        <h1>Fines Board</h1>
        <p className="muted">Unpaid fines double every week.</p>
      </header>

      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

      <section className="panel stack">
        <h2>Leaderboard (unpaid)</h2>
        {totals.length === 0 ? (
          <p className="muted">Nobody owes. For now.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th style={{ textAlign: "right" }}>Owed</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {formatCents(t.cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>All Fines</h2>
          <div className="row">
            {(["all", "unpaid", "paid", "forgiven"] as const).map((f) => (
              <button
                key={f}
                className={filter === f ? "primary" : ""}
                onClick={() => {
                  setFilter(f);
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {fines === null ? (
          <p className="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="muted">No fines match.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due</th>
                {isAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const overdue =
                  r.status === "unpaid" && new Date(r.dueAt).getTime() < now;
                return (
                  <tr key={r.id}>
                    <td>{r.memberName}</td>
                    <td>
                      {r.reason}
                      {r.amountCents !== r.originalAmountCents && (
                        <span className="muted" style={{ marginLeft: 6 }}>
                          (from {formatCents(r.originalAmountCents)})
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatCents(r.amountCents)}
                    </td>
                    <td>
                      <span className={`badge ${r.status}`}>{r.status}</span>
                      {overdue && (
                        <span
                          className="badge overdue"
                          style={{ marginLeft: 4 }}
                        >
                          overdue
                        </span>
                      )}
                    </td>
                    <td className="muted">{formatDate(r.dueAt)}</td>
                    {isAdmin && (
                      <td
                        className="row"
                        style={{ justifyContent: "flex-end" }}
                      >
                        {r.status === "unpaid" && (
                          <>
                            <button
                              className="primary"
                              onClick={() =>
                                act(() => payFine({ data: { id: r.id } }))
                              }
                            >
                              Pay
                            </button>
                            <button
                              onClick={() =>
                                act(() =>
                                  forgiveFine({
                                    data: { id: r.id, note: null },
                                  }),
                                )
                              }
                            >
                              Forgive
                            </button>
                          </>
                        )}
                      </td>
                    )}
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
