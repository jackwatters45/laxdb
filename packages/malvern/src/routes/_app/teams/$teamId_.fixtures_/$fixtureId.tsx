import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Input } from "@laxdb/ui/components/ui/input";
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
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  listRoster,
  type RosterPlayerView,
  type TeamView,
} from "../../../../lib/club";
import {
  deleteMatchImage,
  getFixture,
  listMatchImages,
  listReports,
  submitReport,
  uploadMatchImage,
  type FixtureView,
  type MatchImageView,
  type MatchReportView,
} from "../../../../lib/matches";
import {
  getFixtureStats,
  upsertFixtureStats,
  type FixtureStatSheetView,
} from "../../../../lib/stats";

export const Route = createFileRoute(
  "/_app/teams/$teamId_/fixtures_/$fixtureId",
)({
  beforeLoad: async ({ context, params }) => {
    const fixture = await context.queryClient.ensureQueryData({
      queryKey: ["fixture", params.fixtureId],
      queryFn: () => getFixture({ data: { id: params.fixtureId } }),
    });
    if (fixture.teamId !== params.teamId) {
      throw redirect({
        href: `/teams/${fixture.teamId}/fixtures/${fixture.id}`,
        replace: true,
      });
    }
  },
  component: FixtureDetail,
});

const matchLabel = (fixture: FixtureView) => {
  const opponent = fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;
  const round = fixture.round === null ? "" : ` · Round ${fixture.round}`;
  return `${fixture.isHome ? "vs" : "at"} ${opponent}${round}`;
};

const fixtureKickoff = (fixture: FixtureView) =>
  fixture.scheduledAt === null
    ? "Date and time TBC"
    : new Date(fixture.scheduledAt).toLocaleString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

function FixtureSummary({ fixture }: { readonly fixture: FixtureView }) {
  const completed = fixture.homeScore !== null && fixture.awayScore !== null;
  return (
    <div id="details" className="scroll-mt-24 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>
                {fixture.homeTeamName} {completed ? fixture.homeScore : ""} –{" "}
                {completed ? fixture.awayScore : ""} {fixture.awayTeamName}
              </CardTitle>
              <CardDescription>{fixtureKickoff(fixture)}</CardDescription>
            </div>
            <Badge variant={completed ? "secondary" : "outline"}>
              {completed ? "Completed" : (fixture.matchStatus ?? "Upcoming")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Competition</div>
            <div>{fixture.compName ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Round</div>
            <div>{fixture.round ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Venue</div>
            <div>{fixture.venueName ?? "—"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const playerLabel = (player: RosterPlayerView) =>
  player.jerseyNumber === null
    ? player.name
    : `#${player.jerseyNumber} ${player.name}`;

const acceptedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type AcceptedImageType = (typeof acceptedImageTypes)[number];

const acceptedImageType = (value: string): AcceptedImageType | null => {
  for (const type of acceptedImageTypes) {
    if (type === value) return type;
  }
  return null;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Could not read image file"));
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Could not read image file"));
    });
    reader.readAsDataURL(file);
  });

const imageSizeLabel = (sizeBytes: number) => {
  if (sizeBytes < 1024 * 1024) return `${Math.ceil(sizeBytes / 1024)}KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
};

function FixtureDetail() {
  const routeContext = Route.useRouteContext();
  const { fixtureId } = Route.useParams();

  const fixtureQuery = useQuery({
    queryKey: ["fixture", fixtureId],
    queryFn: () => getFixture({ data: { id: fixtureId } }),
  });
  const fixture = fixtureQuery.data;
  const activeMemberId = routeContext.me?.activeMemberId ?? null;
  const allowedTeamIds = routeContext.isAdmin
    ? null
    : new Set(
        routeContext.teams
          .filter((team: TeamView) => team.coachMemberId === activeMemberId)
          .map((team: TeamView) => team.id),
      );
  const canReport =
    fixture === undefined ||
    allowedTeamIds === null ||
    allowedTeamIds.has(fixture.teamId);
  const teamId = fixture?.teamId ?? "";
  const completed =
    fixture !== undefined &&
    fixture.homeScore !== null &&
    fixture.awayScore !== null;
  const played =
    completed ||
    (fixture?.scheduledAt !== null &&
      fixture?.scheduledAt !== undefined &&
      new Date(fixture.scheduledAt).getTime() <= Date.now());

  const rosterQuery = useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => listRoster({ data: { teamId } }),
    enabled: teamId !== "" && canReport && played,
  });
  const imagesQuery = useQuery({
    queryKey: ["match-images", fixtureId],
    queryFn: () => listMatchImages({ data: { fixtureId } }),
    enabled: fixture !== undefined && canReport && completed,
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", teamId],
    queryFn: () => listReports({ data: { teamId } }),
    enabled: teamId !== "" && canReport && completed,
  });

  const err =
    fixtureQuery.error ??
    rosterQuery.error ??
    imagesQuery.error ??
    reportsQuery.error;

  const roster = rosterQuery.data;
  const images = imagesQuery.data;
  const reports = reportsQuery.data;

  if (fixture === undefined) {
    return err ? (
      <Alert variant="destructive">
        <AlertDescription>{err.message}</AlertDescription>
      </Alert>
    ) : (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Spinner /> Loading fixture…
      </p>
    );
  }

  if (!canReport) {
    return (
      <div className="flex flex-col gap-8">
        <FixtureSummary fixture={fixture} />
        <Alert variant="destructive">
          <AlertDescription>
            You can only view managed fixture details for teams you coach.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!played) {
    return (
      <div className="flex flex-col gap-8">
        <FixtureSummary fixture={fixture} />
        <Card size="sm">
          <CardContent className="text-sm text-muted-foreground">
            Match tools become available after this fixture has been played.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!completed) {
    return roster === undefined ? (
      <div className="flex flex-col gap-8">
        <FixtureSummary fixture={fixture} />
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading game statistics…
        </p>
      </div>
    ) : (
      <div className="flex flex-col gap-8">
        <FixtureSummary fixture={fixture} />
        <FixtureStatsForm
          fixture={fixture}
          roster={roster.filter((player) => player.active)}
        />
        <Card size="sm">
          <CardContent className="text-sm text-muted-foreground">
            Enter paired score overrides above when GameDay is missing the
            result. Reports and photos become available after a completed score
            is synced.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roster || !images || !reports) {
    return (
      <div className="flex flex-col gap-8">
        <FixtureSummary fixture={fixture} />
        {err ? (
          <Alert variant="destructive">
            <AlertDescription>{err.message}</AlertDescription>
          </Alert>
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner /> Loading match tools…
          </p>
        )}
      </div>
    );
  }

  const activeRoster = roster.filter((player) => player.active);
  const existingReport =
    reports.find((entry) => entry.fixtureId === fixture.id) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <FixtureSummary fixture={fixture} />
      <section id="stats" className="scroll-mt-24">
        <FixtureStatsForm fixture={fixture} roster={activeRoster} />
      </section>
      <section id="report" className="scroll-mt-24">
        <ReportFormInner
          fixture={fixture}
          roster={activeRoster}
          images={images}
          existing={existingReport}
        />
      </section>
    </div>
  );
}

type PlayerStatDraft = {
  readonly recorded: boolean;
  readonly goals: string;
  readonly assists: string;
  readonly shots: string;
  readonly saves: string;
};

const optionalCount = (value: string) =>
  value.trim() === "" ? null : Number(value);

function FixtureStatsForm(props: {
  readonly fixture: FixtureView;
  readonly roster: readonly RosterPlayerView[];
}) {
  const { fixture, roster } = props;
  const queryClient = useQueryClient();
  const statsQuery = useQuery({
    queryKey: ["fixture-stats", fixture.id],
    queryFn: () => getFixtureStats({ data: { fixtureId: fixture.id } }),
  });
  const [goalsForOverride, setGoalsForOverride] = useState("");
  const [goalsAgainstOverride, setGoalsAgainstOverride] = useState("");
  const [assistedGoals, setAssistedGoals] = useState("0");
  const [shots, setShots] = useState("");
  const [saves, setSaves] = useState("");
  const [players, setPlayers] = useState<
    Readonly<Record<string, PlayerStatDraft>>
  >({});

  useEffect(() => {
    const sheet = statsQuery.data;
    if (sheet === undefined) return;
    setGoalsForOverride(sheet.team?.goalsForOverride?.toString() ?? "");
    setGoalsAgainstOverride(sheet.team?.goalsAgainstOverride?.toString() ?? "");
    setAssistedGoals(sheet.team?.assistedGoals.toString() ?? "0");
    setShots(sheet.team?.shots?.toString() ?? "");
    setSaves(sheet.team?.saves?.toString() ?? "");
    const existingByPlayer = new Map(
      sheet.players.map((player) => [player.rosterPlayerId, player]),
    );
    setPlayers(
      Object.fromEntries(
        roster.map((player) => {
          const existing = existingByPlayer.get(player.id);
          return [
            player.id,
            {
              recorded: existing !== undefined,
              goals: existing?.goals.toString() ?? "0",
              assists: existing?.assists.toString() ?? "0",
              shots: existing?.shots?.toString() ?? "",
              saves: existing?.saves?.toString() ?? "",
            },
          ];
        }),
      ),
    );
  }, [roster, statsQuery.data]);

  const updatePlayer = (
    playerId: string,
    update: (current: PlayerStatDraft) => PlayerStatDraft,
  ) => {
    setPlayers((current) => {
      const draft = current[playerId] ?? {
        recorded: false,
        goals: "0",
        assists: "0",
        shots: "",
        saves: "",
      };
      return { ...current, [playerId]: update(draft) };
    });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertFixtureStats({
        data: {
          fixtureId: fixture.id,
          goalsForOverride: optionalCount(goalsForOverride),
          goalsAgainstOverride: optionalCount(goalsAgainstOverride),
          assistedGoals: Number(assistedGoals || "0"),
          shots: optionalCount(shots),
          saves: optionalCount(saves),
          players: roster.flatMap((player) => {
            const draft = players[player.id];
            return draft?.recorded === true
              ? [
                  {
                    rosterPlayerId: player.id,
                    goals: Number(draft.goals || "0"),
                    assists: Number(draft.assists || "0"),
                    shots: optionalCount(draft.shots),
                    saves: optionalCount(draft.saves),
                  },
                ]
              : [];
          }),
        },
      }),
    onSuccess: (sheet: FixtureStatSheetView) =>
      Promise.all([
        queryClient.setQueryData(["fixture-stats", fixture.id], sheet),
        queryClient.invalidateQueries({
          queryKey: ["team-summary", fixture.teamId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["team-player-stats", fixture.teamId],
        }),
      ]),
  });

  if (statsQuery.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner /> Loading game statistics…
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game statistics</CardTitle>
        <CardDescription>
          Saved separately from the match report. Blank shots and saves mean
          they were not tracked; local totals are never added to GameDay totals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(statsQuery.error ?? saveMutation.error) && (
          <Alert variant="destructive">
            <AlertDescription>
              {(statsQuery.error ?? saveMutation.error)?.message}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatInput
            label="Goals for override"
            value={goalsForOverride}
            placeholder={String(
              fixture.isHome ? fixture.homeScore : fixture.awayScore,
            )}
            onChange={setGoalsForOverride}
          />
          <StatInput
            label="Goals against override"
            value={goalsAgainstOverride}
            placeholder={String(
              fixture.isHome ? fixture.awayScore : fixture.homeScore,
            )}
            onChange={setGoalsAgainstOverride}
          />
          <StatInput
            label="Assisted goals"
            value={assistedGoals}
            onChange={setAssistedGoals}
          />
          <StatInput label="Shots" value={shots} onChange={setShots} />
          <StatInput label="Saves" value={saves} onChange={setSaves} />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave both score overrides blank to use the GameDay result. Set both
          when correcting a missing or incorrect score.
        </p>

        <div className="space-y-2">
          <div className="grid grid-cols-[minmax(10rem,1fr)_repeat(4,minmax(4rem,0.45fr))] gap-2 text-xs text-muted-foreground">
            <div>Player</div>
            <div>Goals</div>
            <div>Assists</div>
            <div>Shots</div>
            <div>Saves</div>
          </div>
          {roster.map((player) => {
            const draft = players[player.id] ?? {
              recorded: false,
              goals: "0",
              assists: "0",
              shots: "",
              saves: "",
            };
            return (
              <div
                key={player.id}
                className="grid grid-cols-[minmax(10rem,1fr)_repeat(4,minmax(4rem,0.45fr))] items-center gap-2"
              >
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.recorded}
                    onChange={(event) => {
                      updatePlayer(player.id, (current) => ({
                        ...current,
                        recorded: event.currentTarget.checked,
                      }));
                    }}
                  />
                  <span className="truncate">{playerLabel(player)}</span>
                </Label>
                {(["goals", "assists", "shots", "saves"] as const).map(
                  (field) => (
                    <Input
                      key={field}
                      type="number"
                      min="0"
                      value={draft[field]}
                      disabled={!draft.recorded}
                      aria-label={`${player.name} ${field}`}
                      onChange={(event) => {
                        updatePlayer(player.id, (current) => ({
                          ...current,
                          [field]: event.currentTarget.value,
                        }));
                      }}
                    />
                  ),
                )}
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => {
            saveMutation.mutate();
          }}
        >
          {saveMutation.isPending ? "Saving statistics…" : "Save statistics"}
        </Button>
        {saveMutation.isSuccess && (
          <span className="ml-3 text-sm text-muted-foreground">Saved.</span>
        )}
      </CardContent>
    </Card>
  );
}

function StatInput(props: {
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Label className="space-y-1">
      <span className="text-xs text-muted-foreground">{props.label}</span>
      <Input
        type="number"
        min="0"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => {
          props.onChange(event.currentTarget.value);
        }}
      />
    </Label>
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

function MatchImagesCard(props: {
  readonly fixtureId: string;
  readonly images: readonly MatchImageView[];
}) {
  const { fixtureId, images } = props;
  const queryClient = useQueryClient();
  const [clientError, setClientError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (files: readonly File[]) => {
      for (const file of files) {
        const contentType = acceptedImageType(file.type);
        if (contentType === null) {
          throw new Error("Upload JPEG, PNG, WebP, or GIF images only.");
        }
        if (file.size > 10_000_000) {
          throw new Error(`${file.name} is over the 10MB limit.`);
        }
        const dataBase64 = await readFileAsDataUrl(file);
        await uploadMatchImage({
          data: {
            fixtureId,
            fileName: file.name,
            contentType,
            dataBase64,
          },
        });
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["match-images", fixtureId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMatchImage({ data: { id } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["match-images", fixtureId] }),
  });

  const uploadError =
    clientError ??
    (uploadMutation.error instanceof Error
      ? uploadMutation.error.message
      : null);
  const deleteError =
    deleteMutation.error instanceof Error ? deleteMutation.error.message : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game images</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-dashed border-border bg-muted/35 p-4">
          <Label className="flex cursor-pointer flex-col gap-2 text-sm">
            <span className="font-medium">Upload game photos</span>
            <span className="text-muted-foreground">
              JPEG, PNG, WebP, or GIF. Up to 10MB each.
            </span>
            <input
              type="file"
              accept={acceptedImageTypes.join(",")}
              multiple
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
              disabled={uploadMutation.isPending}
              onChange={(event) => {
                const files = [...(event.currentTarget.files ?? [])];
                event.currentTarget.value = "";
                setClientError(null);
                if (files.length === 0) return;
                uploadMutation.mutate(files);
              }}
            />
          </Label>
        </div>

        {uploadMutation.isPending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Uploading images…
          </p>
        )}
        {(uploadError ?? deleteError) && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError ?? deleteError}</AlertDescription>
          </Alert>
        )}

        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No images uploaded for this game yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <figure
                key={image.id}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <img
                  src={`/api/report-images/${image.id}`}
                  alt={image.fileName}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="flex items-center justify-between gap-3 p-3 text-xs">
                  <span className="min-w-0 truncate" title={image.fileName}>
                    {image.fileName}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {imageSizeLabel(image.sizeBytes)}
                  </span>
                </figcaption>
                <div className="border-t px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      deleteMutation.mutate(image.id);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </figure>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportFormInner(props: {
  readonly fixture: FixtureView;
  readonly roster: readonly RosterPlayerView[];
  readonly images: readonly MatchImageView[];
  readonly existing: MatchReportView | null;
}) {
  const { fixture, roster, images, existing } = props;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [top1, setTop1] = useState(existing?.topPlayer1Id ?? "");
  const [top2, setTop2] = useState(existing?.topPlayer2Id ?? "");
  const [top3, setTop3] = useState(existing?.topPlayer3Id ?? "");
  const [blurb, setBlurb] = useState(existing?.blurb ?? "");

  const submitMutation = useMutation({
    mutationFn: () =>
      submitReport({
        data: {
          fixtureId: fixture.id,
          topPlayer1Id: top1,
          topPlayer2Id: top2 || null,
          topPlayer3Id: top3 || null,
          blurb: blurb.trim() || null,
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const busy = submitMutation.isPending;
  const done = submitMutation.data ?? null;
  const err = submitMutation.error;

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
                Saved and emailed to <strong>{done.sentTo.join(", ")}</strong>.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Saved without sending — no report recipients are configured.
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  void router.navigate({ to: "/reports" });
                }}
              >
                View submitted reports
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

        <div id="photos" className="scroll-mt-24">
          <MatchImagesCard fixtureId={fixture.id} images={images} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !top1}>
            {busy ? "Submitting…" : "Submit report"}
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
