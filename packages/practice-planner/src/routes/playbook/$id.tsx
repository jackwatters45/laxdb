import { ApiClient } from "@laxdb/api/client";
import { UpdatePlayInput } from "@laxdb/core/play/play.schema";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { voidAsync } from "@laxdb/ui/lib/void-async";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Check, Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";

import {
  PlayFormFields,
  type PlayFormFieldsProps,
} from "@/components/play-form-fields";
import {
  createEmptyPlayDiagram,
  PlayWhiteboard,
} from "@/components/play-whiteboard";
import { runApi } from "@/lib/api";
import { PLAY_CATEGORY_COLORS } from "@/lib/play-definitions";
import type { PlayCategory, PlayDiagram } from "@/types";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const getPlay = createServerFn({ method: "GET" })
  .inputValidator((data: string) => data)
  .handler(({ data: publicId }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Plays.getPlay({ payload: { publicId } });
      }),
    ),
  );

const updatePlay = createServerFn({ method: "POST" })
  .inputValidator((data: typeof UpdatePlayInput.Type) =>
    Schema.decodeSync(UpdatePlayInput)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Plays.updatePlay({ payload: data });
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/playbook/$id")({
  component: PlayDetailPage,
  loader: ({ params }) => getPlay({ data: params.id }),
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PlayDetailPage() {
  const play = Route.useLoaderData();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [name, setName] = useState(play.name);
  const [category, setCategory] = useState<PlayCategory>(play.category);
  const [formation, setFormation] = useState(play.formation ?? "");
  const [description, setDescription] = useState(play.description ?? "");
  const [personnelNotes, setPersonnelNotes] = useState(
    play.personnelNotes ?? "",
  );
  const [tags, setTags] = useState(play.tags.join(", "));
  const [diagram, setDiagram] = useState(play.diagram);
  const [diagramUrl, setDiagramUrl] = useState(play.diagramUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(play.videoUrl ?? "");

  const resetForm = () => {
    setName(play.name);
    setCategory(play.category);
    setFormation(play.formation ?? "");
    setDescription(play.description ?? "");
    setPersonnelNotes(play.personnelNotes ?? "");
    setTags(play.tags.join(", "));
    setDiagram(play.diagram);
    setDiagramUrl(play.diagramUrl ?? "");
    setVideoUrl(play.videoUrl ?? "");
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await updatePlay({
      data: {
        publicId: play.publicId,
        name,
        category,
        formation: formation || null,
        description: description || null,
        personnelNotes: personnelNotes || null,
        tags: parsedTags,
        diagram,
        diagramUrl: diagramUrl || null,
        videoUrl: videoUrl || null,
      },
    });

    setSaving(false);
    setEditing(false);
    await navigate({
      to: "/playbook/$id",
      params: { id: play.publicId },
      reloadDocument: true,
    });
  };

  if (editing) {
    return (
      <PlayEditView
        name={name}
        setName={setName}
        category={category}
        setCategory={setCategory}
        formation={formation}
        setFormation={setFormation}
        description={description}
        setDescription={setDescription}
        personnelNotes={personnelNotes}
        setPersonnelNotes={setPersonnelNotes}
        tags={tags}
        setTags={setTags}
        diagram={diagram}
        setDiagram={setDiagram}
        diagramUrl={diagramUrl}
        setDiagramUrl={setDiagramUrl}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        saving={saving}
        onSave={voidAsync(handleSave)}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {play.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Play reference, formation notes, and coaching context.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={PLAY_CATEGORY_COLORS[play.category]}
              >
                {play.category}
              </Badge>
              {play.formation && (
                <Badge variant="outline">{play.formation}</Badge>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil size={14} />
            Edit
          </Button>
        </div>

        <Separator />

        <section className="space-y-3" aria-labelledby="play-board-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="play-board-heading"
                className="text-sm font-semibold text-foreground"
              >
                Play board
              </h2>
              <p className="text-xs text-muted-foreground">
                {play.diagram
                  ? "Step through the saved phases or play the sequence."
                  : "No field board has been built for this play yet."}
              </p>
            </div>
            {!play.diagram && (
              <Button
                variant="default"
                size="xl"
                onClick={() => {
                  setDiagram(createEmptyPlayDiagram());
                  setEditing(true);
                }}
              >
                <Plus /> Build board
              </Button>
            )}
          </div>
          {play.diagram && <PlayWhiteboard diagram={play.diagram} readOnly />}
        </section>

        {/* Description */}
        {play.description && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Description
            </h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {play.description}
            </p>
          </section>
        )}

        {/* Personnel Notes */}
        {play.personnelNotes && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Personnel Notes
            </h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {play.personnelNotes}
            </p>
          </section>
        )}

        {/* Tags */}
        {play.tags.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Tags</h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {play.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Links */}
        {(play.diagramUrl ?? play.videoUrl) && (
          <>
            <Separator />
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">
                Resources
              </h2>
              <div className="flex items-center gap-3">
                {play.diagramUrl && (
                  <a
                    href={play.diagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View Diagram
                  </a>
                )}
                {play.videoUrl && (
                  <a
                    href={play.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Watch Video
                  </a>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit View
// ---------------------------------------------------------------------------

interface PlayEditViewProps extends PlayFormFieldsProps {
  diagram: PlayDiagram | null;
  setDiagram: (diagram: PlayDiagram | null) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function PlayEditView(props: PlayEditViewProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Edit Play
            </h1>
            <p className="text-sm text-muted-foreground">
              Update the details, links, and notes coaches use to teach this
              set.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={props.onCancel}>
              Cancel
            </Button>
            <Button
              onClick={props.onSave}
              disabled={props.saving || !props.name}
            >
              {props.saving ? <Loader2 className="animate-spin" /> : <Check />}
              {props.saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
          <section className="space-y-3 lg:sticky lg:top-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Play board
              </h2>
              <p className="text-xs text-muted-foreground">
                Build one phase at a time. Board changes are saved with the
                play.
              </p>
            </div>
            {props.diagram ? (
              <PlayWhiteboard
                diagram={props.diagram}
                onChange={props.setDiagram}
              />
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border-strong bg-muted/30 p-8 text-center">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Start on a lacrosse field
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Add players, the ball, coaching actions, and duplicate
                    phases to show progression.
                  </p>
                </div>
                <Button
                  type="button"
                  size="xl"
                  onClick={() => {
                    props.setDiagram(createEmptyPlayDiagram());
                  }}
                >
                  <Plus /> Build board
                </Button>
              </div>
            )}
          </section>
          <div className="space-y-8 rounded-xl border border-border bg-card p-5">
            <PlayFormFields {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
