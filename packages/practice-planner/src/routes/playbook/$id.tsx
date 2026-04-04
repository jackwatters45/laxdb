import { RpcApiClient } from "@laxdb/api-v2/client";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { ArrowLeft, Check, Loader2, Pencil, X } from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
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

const UpdatePlayForm = Schema.Struct({
  publicId: Schema.String,
  name: Schema.optional(Schema.String),
  category: Schema.optional(
    Schema.Literals([
      "offense",
      "defense",
      "clear",
      "ride",
      "faceoff",
      "emo",
      "man-down",
      "transition",
    ]),
  ),
  formation: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  personnelNotes: Schema.optional(Schema.NullOr(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.String)),
  diagramUrl: Schema.optional(Schema.NullOr(Schema.String)),
  videoUrl: Schema.optional(Schema.NullOr(Schema.String)),
});

const updatePlay = createServerFn({ method: "POST" })
  .inputValidator((data: typeof UpdatePlayForm.Type) =>
    Schema.decodeSync(UpdatePlayForm)(data),
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
// Constants
// ---------------------------------------------------------------------------

const PLAY_CATEGORIES: { value: PlayCategory; label: string }[] = [
  { value: "offense", label: "Offense" },
  { value: "defense", label: "Defense" },
  { value: "clear", label: "Clear" },
  { value: "ride", label: "Ride" },
  { value: "faceoff", label: "Face-off" },
  { value: "emo", label: "EMO" },
  { value: "man-down", label: "Man-Down" },
  { value: "transition", label: "Transition" },
];

const categoryColors: Record<PlayCategory, string> = {
  offense: "bg-blue-500/10 text-blue-600",
  defense: "bg-red-500/10 text-red-600",
  clear: "bg-teal-500/10 text-teal-600",
  ride: "bg-orange-500/10 text-orange-600",
  faceoff: "bg-purple-500/10 text-purple-600",
  emo: "bg-green-500/10 text-green-600",
  "man-down": "bg-amber-500/10 text-amber-600",
  transition: "bg-cyan-500/10 text-cyan-600",
};

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
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center h-14 px-6 border-b border-border bg-card gap-3">
        <Link
          to="/playbook"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-foreground truncate">
          {play.name}
        </h1>
        <div className="flex-1" />
        <Button
          variant="outline"
          onClick={() => {
            setEditing(true);
          }}
        >
          <Pencil size={14} />
          Edit
        </Button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={categoryColors[play.category]}
            >
              {play.category}
            </Badge>
            {play.formation && (
              <Badge variant="outline">{play.formation}</Badge>
            )}
          </div>
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

interface PlayEditViewProps {
  name: string;
  setName: (v: string) => void;
  category: PlayCategory;
  setCategory: (v: PlayCategory) => void;
  formation: string;
  setFormation: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  personnelNotes: string;
  setPersonnelNotes: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  diagramUrl: string;
  setDiagramUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function PlayEditView(props: PlayEditViewProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center h-14 px-6 border-b border-border bg-card gap-3">
        <button
          onClick={props.onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Edit Play</h1>
        <div className="flex-1" />
        <Button variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button onClick={props.onSave} disabled={props.saving || !props.name}>
          {props.saving ? <Loader2 className="animate-spin" /> : <Check />}
          {props.saving ? "Saving…" : "Save"}
        </Button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <PlayFormFields {...props} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Form Fields (used by edit and create pages)
// ---------------------------------------------------------------------------

export function PlayFormFields(props: {
  name: string;
  setName: (v: string) => void;
  category: PlayCategory;
  setCategory: (v: PlayCategory) => void;
  formation: string;
  setFormation: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  personnelNotes: string;
  setPersonnelNotes: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  diagramUrl: string;
  setDiagramUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
}) {
  return (
    <>
      {/* Basic Info */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Basic Info</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Name and category are required. Everything else is optional.
          </p>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={props.name}
              onChange={(e) => {
                props.setName(e.target.value);
              }}
              placeholder="e.g. 2-3-1 Slide"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={props.category}
              onValueChange={(v) => {
                props.setCategory(v as PlayCategory);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="formation">Formation</Label>
            <Input
              id="formation"
              value={props.formation}
              onChange={(e) => {
                props.setFormation(e.target.value);
              }}
              placeholder="e.g. 2-3-1, 1-4-1, 3-3"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={props.description}
              onChange={(e) => {
                props.setDescription(e.target.value);
              }}
              placeholder="Play setup, reads, coaching points..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Personnel */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Personnel</h2>

        <div>
          <Label htmlFor="personnelNotes">Personnel Notes</Label>
          <Textarea
            id="personnelNotes"
            value={props.personnelNotes}
            onChange={(e) => {
              props.setPersonnelNotes(e.target.value);
            }}
            placeholder="Who goes where, matchup assignments, slides..."
            className="min-h-[80px]"
          />
        </div>
      </section>

      <Separator />

      {/* Media */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Resources</h2>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="diagramUrl">Diagram URL</Label>
            <Input
              id="diagramUrl"
              value={props.diagramUrl}
              onChange={(e) => {
                props.setDiagramUrl(e.target.value);
              }}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              value={props.videoUrl}
              onChange={(e) => {
                props.setVideoUrl(e.target.value);
              }}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Tags */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Tags</h2>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={props.tags}
            onChange={(e) => {
              props.setTags(e.target.value);
            }}
            placeholder="settled, unsettled, invert, pick (comma-separated)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comma-separated. Use tags to organize and find plays quickly.
          </p>
        </div>
      </section>
    </>
  );
}
