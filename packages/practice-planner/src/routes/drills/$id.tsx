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
import { Switch } from "@laxdb/ui/components/ui/switch";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Pencil,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
import type { Difficulty, DrillCategory, FieldSpace, Intensity } from "@/types";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const getDrill = createServerFn({ method: "GET" })
  .inputValidator((data: string) => data)
  .handler(({ data: publicId }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DrillGet({ publicId });
      }),
    ),
  );

const UpdateDrillForm = Schema.Struct({
  publicId: Schema.String,
  name: Schema.optional(Schema.String),
  subtitle: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  difficulty: Schema.optional(
    Schema.Literals(["beginner", "intermediate", "advanced"]),
  ),
  category: Schema.optional(
    Schema.Array(
      Schema.Literals([
        "passing",
        "shooting",
        "defense",
        "ground-balls",
        "face-offs",
        "clearing",
        "riding",
        "transition",
        "man-up",
        "man-down",
        "conditioning",
      ]),
    ),
  ),
  positionGroup: Schema.optional(
    Schema.Array(
      Schema.Literals(["attack", "midfield", "defense", "goalie", "all"]),
    ),
  ),
  intensity: Schema.optional(
    Schema.NullOr(Schema.Literals(["low", "medium", "high"])),
  ),
  contact: Schema.optional(Schema.NullOr(Schema.Boolean)),
  competitive: Schema.optional(Schema.NullOr(Schema.Boolean)),
  playerCount: Schema.optional(Schema.NullOr(Schema.Number)),
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  fieldSpace: Schema.optional(
    Schema.NullOr(Schema.Literals(["full-field", "half-field", "box"])),
  ),
  coachNotes: Schema.optional(Schema.NullOr(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.String)),
});

const updateDrill = createServerFn({ method: "POST" })
  .inputValidator((data: typeof UpdateDrillForm.Type) =>
    Schema.decodeSync(UpdateDrillForm)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DrillUpdate(data);
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/drills/$id")({
  component: DrillDetailPage,
  loader: ({ params }) => getDrill({ data: params.id }),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: DrillCategory; label: string }[] = [
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defense", label: "Defense" },
  { value: "ground-balls", label: "Ground Balls" },
  { value: "face-offs", label: "Face-offs" },
  { value: "clearing", label: "Clearing" },
  { value: "riding", label: "Riding" },
  { value: "transition", label: "Transition" },
  { value: "man-up", label: "Man-Up" },
  { value: "man-down", label: "Man-Down" },
  { value: "conditioning", label: "Conditioning" },
];

const POSITION_GROUPS = [
  { value: "attack", label: "Attack" },
  { value: "midfield", label: "Midfield" },
  { value: "defense", label: "Defense" },
  { value: "goalie", label: "Goalie" },
  { value: "all", label: "All" },
] as const;

const difficultyColors: Record<Difficulty, string> = {
  beginner: "bg-green-500/10 text-green-600",
  intermediate: "bg-amber-500/10 text-amber-600",
  advanced: "bg-red-500/10 text-red-600",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DrillDetailPage() {
  const drill = Route.useLoaderData();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [name, setName] = useState(drill.name);
  const [subtitle, setSubtitle] = useState(drill.subtitle ?? "");
  const [description, setDescription] = useState(drill.description ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(drill.difficulty);
  const [categories, setCategories] = useState<DrillCategory[]>([
    ...drill.category,
  ]);
  const [positionGroups, setPositionGroups] = useState<string[]>([
    ...drill.positionGroup,
  ]);
  const [intensity, setIntensity] = useState<Intensity | "">(
    drill.intensity ?? "",
  );
  const [contact, setContact] = useState(drill.contact ?? false);
  const [competitive, setCompetitive] = useState(drill.competitive ?? false);
  const [playerCount, setPlayerCount] = useState(
    drill.playerCount?.toString() ?? "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    drill.durationMinutes?.toString() ?? "",
  );
  const [fieldSpace, setFieldSpace] = useState<FieldSpace | "">(
    drill.fieldSpace ?? "",
  );
  const [coachNotes, setCoachNotes] = useState(drill.coachNotes ?? "");
  const [tags, setTags] = useState(drill.tags.join(", "));

  const resetForm = () => {
    setName(drill.name);
    setSubtitle(drill.subtitle ?? "");
    setDescription(drill.description ?? "");
    setDifficulty(drill.difficulty);
    setCategories([...drill.category]);
    setPositionGroups([...drill.positionGroup]);
    setIntensity(drill.intensity ?? "");
    setContact(drill.contact ?? false);
    setCompetitive(drill.competitive ?? false);
    setPlayerCount(drill.playerCount?.toString() ?? "");
    setDurationMinutes(drill.durationMinutes?.toString() ?? "");
    setFieldSpace(drill.fieldSpace ?? "");
    setCoachNotes(drill.coachNotes ?? "");
    setTags(drill.tags.join(", "));
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

    await updateDrill({
      data: {
        publicId: drill.publicId,
        name,
        subtitle: subtitle || null,
        description: description || null,
        difficulty,
        category: categories,
        positionGroup: positionGroups as typeof drill.positionGroup,
        intensity: (intensity as Intensity) || null,
        contact,
        competitive,
        playerCount: playerCount ? parseInt(playerCount, 10) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        fieldSpace: (fieldSpace as FieldSpace) || null,
        coachNotes: coachNotes || null,
        tags: parsedTags,
      },
    });

    setSaving(false);
    setEditing(false);
    // Reload drill data
    await navigate({
      to: "/drills/$id",
      params: { id: drill.publicId },
      reloadDocument: true,
    });
  };

  if (editing) {
    return (
      <DrillEditView
        name={name}
        setName={setName}
        subtitle={subtitle}
        setSubtitle={setSubtitle}
        description={description}
        setDescription={setDescription}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        categories={categories}
        setCategories={setCategories}
        positionGroups={positionGroups}
        setPositionGroups={setPositionGroups}
        intensity={intensity}
        setIntensity={setIntensity}
        contact={contact}
        setContact={setContact}
        competitive={competitive}
        setCompetitive={setCompetitive}
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
        durationMinutes={durationMinutes}
        setDurationMinutes={setDurationMinutes}
        fieldSpace={fieldSpace}
        setFieldSpace={setFieldSpace}
        coachNotes={coachNotes}
        setCoachNotes={setCoachNotes}
        tags={tags}
        setTags={setTags}
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
          to="/drills"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-foreground truncate">
          {drill.name}
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
              className={difficultyColors[drill.difficulty]}
            >
              {drill.difficulty}
            </Badge>
            {drill.intensity && (
              <Badge variant="outline">{drill.intensity} intensity</Badge>
            )}
            {drill.fieldSpace && (
              <Badge variant="outline">{drill.fieldSpace}</Badge>
            )}
          </div>
          {drill.subtitle && (
            <p className="text-sm text-muted-foreground">{drill.subtitle}</p>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {drill.durationMinutes && (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Clock size={14} />
              {drill.durationMinutes} min
            </span>
          )}
          {drill.playerCount && (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Users size={14} />
              {drill.playerCount}+ players
            </span>
          )}
          {drill.contact !== null && (
            <span>{drill.contact ? "Contact" : "Non-contact"}</span>
          )}
          {drill.competitive !== null && (
            <span>{drill.competitive ? "Competitive" : "Non-competitive"}</span>
          )}
        </div>

        <Separator />

        {/* Description */}
        {drill.description && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Description
            </h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {drill.description}
            </p>
          </section>
        )}

        {/* Categories */}
        {drill.category.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Categories
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {drill.category.map((cat) => (
                <Badge key={cat} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Position Groups */}
        {drill.positionGroup.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Position Groups
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {drill.positionGroup.map((pg) => (
                <Badge key={pg} variant="outline">
                  {pg}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {drill.tags.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Tags</h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {drill.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Coach Notes */}
        {drill.coachNotes && (
          <>
            <Separator />
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">
                Coach Notes
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {drill.coachNotes}
              </p>
            </section>
          </>
        )}

        {/* Equipment */}
        {drill.equipment && drill.equipment.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Equipment</h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {drill.equipment.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Links */}
        {(drill.diagramUrl ?? drill.videoUrl) && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Resources</h2>
            <div className="flex items-center gap-3">
              {drill.diagramUrl && (
                <a
                  href={drill.diagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  View Diagram
                </a>
              )}
              {drill.videoUrl && (
                <a
                  href={drill.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Watch Video
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit View
// ---------------------------------------------------------------------------

interface DrillEditViewProps {
  name: string;
  setName: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  categories: DrillCategory[];
  setCategories: (v: DrillCategory[]) => void;
  positionGroups: string[];
  setPositionGroups: (v: string[]) => void;
  intensity: Intensity | "";
  setIntensity: (v: Intensity | "") => void;
  contact: boolean;
  setContact: (v: boolean) => void;
  competitive: boolean;
  setCompetitive: (v: boolean) => void;
  playerCount: string;
  setPlayerCount: (v: string) => void;
  durationMinutes: string;
  setDurationMinutes: (v: string) => void;
  fieldSpace: FieldSpace | "";
  setFieldSpace: (v: FieldSpace | "") => void;
  coachNotes: string;
  setCoachNotes: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function DrillEditView(props: DrillEditViewProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center h-14 px-6 border-b border-border bg-card gap-3">
        <button
          onClick={props.onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Edit Drill</h1>
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
        <DrillFormFields {...props} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Form Fields (used by edit and create pages)
// ---------------------------------------------------------------------------

export function DrillFormFields(props: {
  name: string;
  setName: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  categories: DrillCategory[];
  setCategories: (v: DrillCategory[]) => void;
  positionGroups: string[];
  setPositionGroups: (v: string[]) => void;
  intensity: Intensity | "";
  setIntensity: (v: Intensity | "") => void;
  contact: boolean;
  setContact: (v: boolean) => void;
  competitive: boolean;
  setCompetitive: (v: boolean) => void;
  playerCount: string;
  setPlayerCount: (v: string) => void;
  durationMinutes: string;
  setDurationMinutes: (v: string) => void;
  fieldSpace: FieldSpace | "";
  setFieldSpace: (v: FieldSpace | "") => void;
  coachNotes: string;
  setCoachNotes: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
}) {
  return (
    <>
      {/* Basic Info */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Basic Info</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Name is required. Everything else is optional.
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
              placeholder="e.g. 3v2 Ground Ball Scoop"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={props.subtitle}
              onChange={(e) => {
                props.setSubtitle(e.target.value);
              }}
              placeholder="Short description"
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
              placeholder="Drill setup, rules, coaching points..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Classification */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Classification
        </h2>

        <div className="grid gap-4">
          <div>
            <Label>Difficulty</Label>
            <Select
              value={props.difficulty}
              onValueChange={(v) => {
                props.setDifficulty(v as Difficulty);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categories</Label>
            <ToggleGroup
              value={props.categories}
              onValueChange={(values) => {
                props.setCategories(values as DrillCategory[]);
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap justify-start"
            >
              {CATEGORIES.map((cat) => (
                <ToggleGroupItem key={cat.value} value={cat.value}>
                  {cat.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div>
            <Label>Position Groups</Label>
            <ToggleGroup
              value={props.positionGroups}
              onValueChange={(values) => {
                props.setPositionGroups(values);
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap justify-start"
            >
              {POSITION_GROUPS.map((pg) => (
                <ToggleGroupItem key={pg.value} value={pg.value}>
                  {pg.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </section>

      <Separator />

      {/* Logistics */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Logistics</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">
              <Clock size={12} className="inline mr-1.5 -mt-0.5" />
              Duration (min)
            </Label>
            <Input
              id="duration"
              type="number"
              value={props.durationMinutes}
              onChange={(e) => {
                props.setDurationMinutes(e.target.value);
              }}
              placeholder="15"
              min={1}
              max={120}
            />
          </div>
          <div>
            <Label htmlFor="playerCount">
              <Users size={12} className="inline mr-1.5 -mt-0.5" />
              Min Players
            </Label>
            <Input
              id="playerCount"
              type="number"
              value={props.playerCount}
              onChange={(e) => {
                props.setPlayerCount(e.target.value);
              }}
              placeholder="6"
              min={1}
              max={50}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Intensity</Label>
            <Select
              value={props.intensity || undefined}
              onValueChange={(v) => {
                props.setIntensity(v as Intensity);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Field Space</Label>
            <Select
              value={props.fieldSpace || undefined}
              onValueChange={(v) => {
                props.setFieldSpace(v as FieldSpace);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-field">Full Field</SelectItem>
                <SelectItem value="half-field">Half Field</SelectItem>
                <SelectItem value="box">Box</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="contact"
              checked={props.contact}
              onCheckedChange={props.setContact}
            />
            <Label htmlFor="contact">Contact</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="competitive"
              checked={props.competitive}
              onCheckedChange={props.setCompetitive}
            />
            <Label htmlFor="competitive">Competitive</Label>
          </div>
        </div>
      </section>

      <Separator />

      {/* Notes & Tags */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Notes & Tags</h2>

        <div>
          <Label htmlFor="coachNotes">Coach Notes</Label>
          <Textarea
            id="coachNotes"
            value={props.coachNotes}
            onChange={(e) => {
              props.setCoachNotes(e.target.value);
            }}
            placeholder="Private coaching notes, variations, progressions..."
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={props.tags}
            onChange={(e) => {
              props.setTags(e.target.value);
            }}
            placeholder="warmup, cooldown, team-building (comma-separated)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comma-separated. Use "warmup" or "cooldown" to categorize
            automatically.
          </p>
        </div>
      </section>
    </>
  );
}
