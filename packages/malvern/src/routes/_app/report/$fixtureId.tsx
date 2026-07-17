import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
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
  listRoster,
  type RosterPlayerView,
  type TeamView,
} from "../../../lib/club";
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
} from "../../../lib/matches";

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

function ReportForm() {
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

  const rosterQuery = useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => listRoster({ data: { teamId } }),
    enabled: teamId !== "" && canReport,
  });
  const imagesQuery = useQuery({
    queryKey: ["match-images", fixtureId],
    queryFn: () => listMatchImages({ data: { fixtureId } }),
    enabled: fixture !== undefined && canReport,
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", teamId],
    queryFn: () => listReports({ data: { teamId } }),
    enabled: teamId !== "" && canReport,
  });

  const err =
    fixtureQuery.error ??
    rosterQuery.error ??
    imagesQuery.error ??
    reportsQuery.error;

  const roster = rosterQuery.data;
  const images = imagesQuery.data;
  const reports = reportsQuery.data;

  if (fixture && !canReport) {
    return (
      <div className="flex flex-col gap-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Match report
          </h1>
          <p className="text-sm text-muted-foreground">{matchLabel(fixture)}</p>
        </header>
        <Alert variant="destructive">
          <AlertDescription>
            You can only submit reports for teams you coach.
          </AlertDescription>
        </Alert>
        <Link
          to="/fixtures"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Back to fixtures
        </Link>
      </div>
    );
  }

  if (!fixture || !roster || !images || !reports) {
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
      images={images}
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
    onSuccess: () =>
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
        {uploadError && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError}</AlertDescription>
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
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["reports", fixture.teamId],
      }),
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

        <MatchImagesCard fixtureId={fixture.id} images={images} />

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
