import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Checkbox } from "@laxdb/ui/components/ui/checkbox";
import { Label } from "@laxdb/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

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

const playerLabel = (player: RosterPlayerView) =>
  player.jerseyNumber === null
    ? player.name
    : `#${player.jerseyNumber} ${player.name}`;

function ReportForm() {
  const { fixtureId } = Route.useParams();

  const fixtureQuery = useQuery({
    queryKey: ["fixture", fixtureId],
    queryFn: () => getFixture({ data: { id: fixtureId } }),
  });
  const fixture = fixtureQuery.data;
  const teamId = fixture?.teamId ?? "";

  const rosterQuery = useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => listRoster({ data: { teamId } }),
    enabled: teamId !== "",
  });
  const recipientsQuery = useQuery({
    queryKey: ["recipients", teamId],
    queryFn: () => listRecipientsForTeam({ data: { teamId } }),
    enabled: teamId !== "",
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", teamId],
    queryFn: () => listReports({ data: { teamId } }),
    enabled: teamId !== "",
  });

  const err =
    fixtureQuery.error ??
    rosterQuery.error ??
    recipientsQuery.error ??
    reportsQuery.error;

  const roster = rosterQuery.data;
  const recipients = recipientsQuery.data;
  const reports = reportsQuery.data;

  if (!fixture || !roster || !recipients || !reports) {
    return (
      <div className="flex flex-col gap-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Match report
          </h1>
          <p className="text-sm text-muted-foreground">
            {fixture ? matchLabel(fixture) : "Loading fixture…"}
          </p>
        </header>
        {err ? (
          <Alert variant="destructive">
            <AlertDescription>{err.message}</AlertDescription>
          </Alert>
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            Loading…
          </p>
        )}
      </div>
    );
  }

  return (
    <ReportFormInner
      fixture={fixture}
      roster={roster.filter((player) => player.active)}
      recipients={recipients}
      existing={reports.find((entry) => entry.fixtureId === fixture.id) ?? null}
    />
  );
}

function PlayerPicker(props: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly required: boolean;
  readonly roster: readonly RosterPlayerView[];
}) {
  const items = [
    { value: null, label: "— player —" },
    ...props.roster.map((player) => ({
      value: player.id,
      label: playerLabel(player),
    })),
  ];

  return (
    <div className="flex flex-1 flex-col gap-1">
      <Label className="text-muted-foreground">{props.label}</Label>
      <Select
        items={items}
        value={props.value === "" ? null : props.value}
        onValueChange={(next) => {
          props.onChange(next ?? "");
        }}
        required={props.required}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value ?? ""} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReportFormInner(props: {
  readonly fixture: FixtureView;
  readonly roster: readonly RosterPlayerView[];
  readonly recipients: readonly RecipientView[];
  readonly existing: MatchReportView | null;
}) {
  const { fixture, roster, recipients, existing } = props;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [top1, setTop1] = useState(existing?.topPlayer1Id ?? "");
  const [top2, setTop2] = useState(existing?.topPlayer2Id ?? "");
  const [top3, setTop3] = useState(existing?.topPlayer3Id ?? "");
  const [blurb, setBlurb] = useState(existing?.blurb ?? "");
  const [selectedRecipients, setSelectedRecipients] = useState(
    () => new Set(recipients.map((recipient) => recipient.id)),
  );

  const submitMutation = useMutation({
    mutationFn: () =>
      submitReport({
        data: {
          fixtureId: fixture.id,
          topPlayer1Id: top1,
          topPlayer2Id: top2 || null,
          topPlayer3Id: top3 || null,
          blurb: blurb.trim() || null,
          recipientIds: [...selectedRecipients],
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["reports", fixture.teamId],
      }),
  });

  const busy = submitMutation.isPending;
  const done = submitMutation.data ?? null;
  const err = submitMutation.error;

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!top1) return;
    submitMutation.mutate();
  };

  if (done) {
    return (
      <div className="flex flex-col gap-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Report submitted
          </h1>
          <p className="text-sm text-muted-foreground">{matchLabel(fixture)}</p>
        </header>
        <Card>
          <CardContent className="flex flex-col gap-4">
            {done.sentAt ? (
              <p>
                Emailed to <strong>{done.sentTo.join(", ")}</strong>.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Saved without sending — no recipients selected.
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  void router.navigate({ to: "/fixtures" });
                }}
              >
                Back to fixtures
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Match report</h1>
        <p className="text-sm text-muted-foreground">
          {matchLabel(fixture)}
          {existing && " · editing existing report"}
        </p>
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}

      {roster.length === 0 && (
        <Card size="sm">
          <CardContent className="text-muted-foreground">
            Your roster is empty — add players under{" "}
            <Link
              to="/roster"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Roster
            </Link>{" "}
            first.
          </CardContent>
        </Card>
      )}

      <form className="flex flex-col gap-8" onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>Top three players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PlayerPicker
                label="1. Best on ground"
                value={top1}
                onChange={setTop1}
                required
                roster={roster}
              />
              <PlayerPicker
                label="2."
                value={top2}
                onChange={setTop2}
                required={false}
                roster={roster}
              />
              <PlayerPicker
                label="3."
                value={top3}
                onChange={setTop3}
                required={false}
                roster={roster}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game blurb</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              placeholder="Short summary of the game for the newsletter / social media…"
              value={blurb}
              onChange={(e) => {
                setBlurb(e.currentTarget.value);
              }}
              className="min-h-32"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send to</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recipients.length === 0 ? (
              <p className="text-muted-foreground">
                No recipients configured. An admin can add them under Admin —
                you can still save the report without sending.
              </p>
            ) : (
              recipients.map((recipient) => (
                <Label
                  key={recipient.id}
                  className="cursor-pointer font-normal"
                >
                  <Checkbox
                    checked={selectedRecipients.has(recipient.id)}
                    onCheckedChange={() => {
                      toggleRecipient(recipient.id);
                    }}
                  />
                  <span>
                    {recipient.label}{" "}
                    <span className="text-muted-foreground">
                      ({recipient.email})
                    </span>
                  </span>
                </Label>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !top1}>
            {busy
              ? "Submitting…"
              : selectedRecipients.size > 0
                ? "Submit & email"
                : "Save report"}
          </Button>
          <Link
            to="/fixtures"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
