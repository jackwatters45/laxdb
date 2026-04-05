import { RpcApiClient } from "@laxdb/api/client";
import { UpdatePlayInput } from "@laxdb/core/play/play.schema";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Check, Loader2, Pencil } from "lucide-react";
import { useState } from "react";

import {
  PlayFormFields,
  type PlayFormFieldsProps,
} from "@/components/play-form-fields";
import { runApi } from "@/lib/api";
import { PLAY_CATEGORY_COLORS } from "@/lib/play-definitions";
import type { PlayCategory } from "@/types";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const getPlay = createServerFn({ method: "GET" })
  .inputValidator((data: string) => data)
  .handler(({ data: publicId }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PlayGet({ publicId });
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
        const client = yield* RpcApiClient;
        return yield* client.PlayUpdate(data);
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
  const [diagramUrl, setDiagramUrl] = useState(play.diagramUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(play.videoUrl ?? "");

  const resetForm = () => {
    setName(play.name);
    setCategory(play.category);
    setFormation(play.formation ?? "");
    setDescription(play.description ?? "");
    setPersonnelNotes(play.personnelNotes ?? "");
    setTags(play.tags.join(", "));
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
        diagramUrl={diagramUrl}
        setDiagramUrl={setDiagramUrl}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        saving={saving}
        onSave={() => {
          void handleSave();
        }}
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
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function PlayEditView(props: PlayEditViewProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
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

        <PlayFormFields {...props} />
      </div>
    </div>
  );
}
