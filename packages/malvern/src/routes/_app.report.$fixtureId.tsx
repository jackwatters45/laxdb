import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  listRecipientsForTeam,
  listRoster,
  type RecipientView,
  type RosterPlayerView,
} from "../lib/club";
import {
  getFixture,
  listReports,
  submitReport,
  type FixtureView,
  type MatchReportView,
} from "../lib/matches";

export const Route = createFileRoute("/_app/report/$fixtureId")({
  component: ReportForm,
});

const matchLabel = (fixture: FixtureView) => {
  const opponent = fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;
  const round = fixture.round === null ? "" : ` · Round ${fixture.round}`;
  return `vs ${opponent}${round}`;
};

function ReportForm() {
  const { fixtureId } = Route.useParams();
  const router = useRouter();

  const [fixture, setFixture] = useState<FixtureView | null>(null);
  const [roster, setRoster] = useState<readonly RosterPlayerView[]>([]);
  const [recipients, setRecipients] = useState<readonly RecipientView[]>([]);
  const [existing, setExisting] = useState<MatchReportView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [top1, setTop1] = useState("");
  const [top2, setTop2] = useState("");
  const [top3, setTop3] = useState("");
  const [blurb, setBlurb] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState(
    new Set<string>(),
  );
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<MatchReportView | null>(null);

  useEffect(() => {
    getFixture({ data: { id: fixtureId } })
      .then(async (loaded) => {
        setFixture(loaded);
        const [players, recips, reports] = await Promise.all([
          listRoster({ data: { teamId: loaded.teamId } }),
          listRecipientsForTeam({ data: { teamId: loaded.teamId } }),
          listReports({ data: { teamId: loaded.teamId } }),
        ]);
        setRoster(players.filter((player) => player.active));
        setRecipients(recips);
        setSelectedRecipients(new Set(recips.map((recipient) => recipient.id)));
        const report = reports.find((entry) => entry.fixtureId === loaded.id);
        if (report) {
          setExisting(report);
          setTop1(report.topPlayer1Id);
          setTop2(report.topPlayer2Id ?? "");
          setTop3(report.topPlayer3Id ?? "");
          setBlurb(report.blurb ?? "");
        }
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  }, [fixtureId]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!top1) return;
    setBusy(true);
    setErr(null);
    try {
      const report = await submitReport({
        data: {
          fixtureId,
          topPlayer1Id: top1,
          topPlayer2Id: top2 || null,
          topPlayer3Id: top3 || null,
          blurb: blurb.trim() || null,
          recipientIds: [...selectedRecipients],
        },
      });
      setDone(report);
    } catch (cause) {
      setErr(String(cause));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="stack" style={{ gap: "2rem" }}>
        <header>
          <h1>Report submitted</h1>
          {fixture && <p className="muted">{matchLabel(fixture)}</p>}
        </header>
        <section className="panel stack">
          {done.sentAt ? (
            <p>
              Emailed to <strong>{done.sentTo.join(", ")}</strong>.
            </p>
          ) : (
            <p className="muted">
              Saved without sending — no recipients selected.
            </p>
          )}
          <div className="row">
            <button
              className="primary"
              onClick={() => {
                void router.navigate({ to: "/fixtures" });
              }}
            >
              Back to fixtures
            </button>
          </div>
        </section>
      </div>
    );
  }

  const pickerFor = (
    label: string,
    value: string,
    setValue: (next: string) => void,
    required: boolean,
  ) => (
    <label className="stack" style={{ gap: "0.25rem", flex: 1 }}>
      <span className="muted" style={{ fontSize: "0.8rem" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => {
          setValue(e.currentTarget.value);
        }}
        required={required}
      >
        <option value="">— player —</option>
        {roster.map((player) => (
          <option key={player.id} value={player.id}>
            {player.jerseyNumber === null
              ? player.name
              : `#${player.jerseyNumber} ${player.name}`}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header>
        <h1>Match report</h1>
        <p className="muted">
          {fixture ? matchLabel(fixture) : "Loading fixture…"}
          {existing && " · editing existing report"}
        </p>
      </header>

      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

      {roster.length === 0 && fixture !== null && (
        <section className="panel stack">
          <p className="muted">
            Your roster is empty — add players under{" "}
            <Link to="/roster">Roster</Link> first.
          </p>
        </section>
      )}

      <form className="stack" style={{ gap: "2rem" }} onSubmit={submit}>
        <section className="panel stack">
          <h2>Top three players</h2>
          <div className="row">
            {pickerFor("1. Best on ground", top1, setTop1, true)}
            {pickerFor("2.", top2, setTop2, false)}
            {pickerFor("3.", top3, setTop3, false)}
          </div>
        </section>

        <section className="panel stack">
          <h2>Game blurb</h2>
          <textarea
            rows={6}
            placeholder="Short summary of the game for the newsletter / social media…"
            value={blurb}
            onChange={(e) => {
              setBlurb(e.currentTarget.value);
            }}
            style={{ width: "100%", resize: "vertical" }}
          />
        </section>

        <section className="panel stack">
          <h2>Send to</h2>
          {recipients.length === 0 ? (
            <p className="muted">
              No recipients configured. An admin can add them under Admin — you
              can still save the report without sending.
            </p>
          ) : (
            recipients.map((recipient) => (
              <label
                key={recipient.id}
                className="row"
                style={{ gap: "0.5rem" }}
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.has(recipient.id)}
                  onChange={() => {
                    toggleRecipient(recipient.id);
                  }}
                />
                <span>
                  {recipient.label}{" "}
                  <span className="muted">({recipient.email})</span>
                </span>
              </label>
            ))
          )}
        </section>

        <div className="row">
          <button className="primary" type="submit" disabled={busy || !top1}>
            {busy
              ? "Submitting…"
              : selectedRecipients.size > 0
                ? "Submit & email"
                : "Save report"}
          </button>
          <Link to="/fixtures">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
