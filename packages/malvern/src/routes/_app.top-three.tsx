import { DisplayDateFromDate } from "@laxdb/core/schema";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { useEffect, useMemo, useState } from "react";

import {
  listFixtures,
  listPlayers,
  listTeams,
  submitTopThree,
  type FixtureView,
  type PlayerView,
  type TeamView,
  type TopThreeSubmissionView,
} from "../lib/malvern";

const formatDate = (value: Date | string | number | null) => {
  if (value === null) return "TBC";
  return Schema.decodeSync(DisplayDateFromDate)(new Date(value));
};

export const Route = createFileRoute("/_app/top-three")({
  component: TopThree,
});

function TopThree() {
  const [teams, setTeams] = useState<readonly TeamView[]>([]);
  const [teamPublicId, setTeamPublicId] = useState("");
  const [fixtures, setFixtures] = useState<readonly FixtureView[]>([]);
  const [players, setPlayers] = useState<readonly PlayerView[]>([]);
  const [fixturePublicId, setFixturePublicId] = useState("");
  const [firstPlayerPublicId, setFirstPlayerPublicId] = useState("");
  const [secondPlayerPublicId, setSecondPlayerPublicId] = useState("");
  const [thirdPlayerPublicId, setThirdPlayerPublicId] = useState("");
  const [blurb, setBlurb] = useState("");
  const [recipientText, setRecipientText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<TopThreeSubmissionView | null>(
    null,
  );

  useEffect(() => {
    listTeams()
      .then((rows) => {
        setTeams(rows);
        const firstTeam = rows[0];
        if (firstTeam !== undefined) {
          setTeamPublicId(firstTeam.publicId);
          setRecipientText(firstTeam.defaultRecipientEmails.join(", "));
        }
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  }, []);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.publicId === teamPublicId) ?? null,
    [teamPublicId, teams],
  );

  useEffect(() => {
    if (teamPublicId === "") return;
    Promise.all([
      listFixtures({ data: { teamPublicId } }),
      listPlayers({ data: { teamPublicId } }),
    ])
      .then(([fixtureRows, playerRows]) => {
        setFixtures(fixtureRows);
        setPlayers(playerRows.filter((player) => player.active));
        const firstFixture =
          fixtureRows.find(
            (fixture) =>
              fixture.startsAt === null ||
              new Date(fixture.startsAt) >= new Date(),
          ) ?? fixtureRows[0];
        setFixturePublicId(firstFixture?.publicId ?? "");
        setFirstPlayerPublicId("");
        setSecondPlayerPublicId("");
        setThirdPlayerPublicId("");
        return null;
      })
      .catch((cause) => {
        setErr(String(cause));
      });
  }, [teamPublicId]);

  useEffect(() => {
    if (selectedTeam !== null) {
      setRecipientText(selectedTeam.defaultRecipientEmails.join(", "));
    }
  }, [selectedTeam]);

  const playerOptions = players.map((player) => (
    <option key={player.publicId} value={player.publicId}>
      {player.jumperNumber === null ? "" : `#${player.jumperNumber} · `}
      {player.name}
    </option>
  ));

  const recipientEmails = () =>
    recipientText
      .split(/[\n,;]/u)
      .map((email) => email.trim())
      .filter(Boolean);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr(null);
    setSubmitted(null);

    const picks = [
      firstPlayerPublicId,
      secondPlayerPublicId,
      thirdPlayerPublicId,
    ].filter(Boolean);
    if (fixturePublicId === "" || picks.length !== 3) {
      setErr("Choose a fixture and three players.");
      return;
    }
    if (new Set(picks).size !== 3) {
      setErr("Pick three different players.");
      return;
    }

    setBusy(true);
    try {
      const result = await submitTopThree({
        data: {
          fixturePublicId,
          firstPlayerPublicId,
          secondPlayerPublicId,
          thirdPlayerPublicId,
          blurb: blurb.trim() === "" ? null : blurb.trim(),
          recipientEmails: recipientEmails(),
        },
      });
      setSubmitted(result);
      setBlurb("");
    } catch (cause) {
      setErr(String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <header>
        <h1>Top Three Players</h1>
        <p className="muted">
          Coaches submit their three best players plus a short match blurb.
        </p>
      </header>

      {err && (
        <div className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </div>
      )}

      {submitted && (
        <section className="panel stack">
          <h2>Submission saved</h2>
          <p className="muted">
            Email prepared for {submitted.recipientEmails.join(", ")}.
          </p>
          <a href={mailtoFor(submitted)}>Open email draft</a>
          <pre>{submitted.emailBody}</pre>
        </section>
      )}

      {teams.length === 0 ? (
        <section className="panel stack">
          <h2>No roster yet</h2>
          <p className="muted">
            Ask an administrator to add your Malvern team, roster, GameDay
            fixture URL, and recipient list.
          </p>
        </section>
      ) : (
        <section className="panel stack">
          <form className="stack" onSubmit={submit}>
            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="muted">Team</span>
              <select
                value={teamPublicId}
                onChange={(event) => {
                  setTeamPublicId(event.currentTarget.value);
                }}
              >
                {teams.map((team) => (
                  <option key={team.publicId} value={team.publicId}>
                    {team.name}
                    {team.grade === null ? "" : ` · ${team.grade}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="muted">Fixture</span>
              <select
                value={fixturePublicId}
                onChange={(event) => {
                  setFixturePublicId(event.currentTarget.value);
                }}
              >
                <option value="">— select fixture —</option>
                {fixtures.map((fixture) => (
                  <option key={fixture.publicId} value={fixture.publicId}>
                    {fixture.roundLabel} · {formatDate(fixture.startsAt)} · vs{" "}
                    {fixture.opponent}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid three">
              <label className="stack" style={{ gap: "0.25rem" }}>
                <span className="muted">1st</span>
                <select
                  value={firstPlayerPublicId}
                  onChange={(event) => {
                    setFirstPlayerPublicId(event.currentTarget.value);
                  }}
                >
                  <option value="">— player —</option>
                  {playerOptions}
                </select>
              </label>
              <label className="stack" style={{ gap: "0.25rem" }}>
                <span className="muted">2nd</span>
                <select
                  value={secondPlayerPublicId}
                  onChange={(event) => {
                    setSecondPlayerPublicId(event.currentTarget.value);
                  }}
                >
                  <option value="">— player —</option>
                  {playerOptions}
                </select>
              </label>
              <label className="stack" style={{ gap: "0.25rem" }}>
                <span className="muted">3rd</span>
                <select
                  value={thirdPlayerPublicId}
                  onChange={(event) => {
                    setThirdPlayerPublicId(event.currentTarget.value);
                  }}
                >
                  <option value="">— player —</option>
                  {playerOptions}
                </select>
              </label>
            </div>

            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="muted">Blurb</span>
              <textarea
                value={blurb}
                onChange={(event) => {
                  setBlurb(event.currentTarget.value);
                }}
                placeholder="Short notes for the newsletter/admin email…"
                rows={5}
              />
            </label>

            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="muted">Recipients</span>
              <textarea
                value={recipientText}
                onChange={(event) => {
                  setRecipientText(event.currentTarget.value);
                }}
                placeholder="president@malvernlacrosse.com, media@malvernlacrosse.com"
                rows={2}
              />
            </label>

            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit top three"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

const mailtoFor = (submission: TopThreeSubmissionView) =>
  `mailto:${submission.recipientEmails.join(",")}?subject=${encodeURIComponent(
    submission.emailSubject,
  )}&body=${encodeURIComponent(submission.emailBody)}`;
