import { RpcApiClient } from "@laxdb/api/client";
import { UpdateDrillInput } from "@laxdb/core/drill/drill.schema";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Check, Clock, Loader2, Pencil, Users } from "lucide-react";
import { useState } from "react";

import {
  DrillFormFields,
  type DrillFormFieldsProps,
} from "@/components/drill-form-fields";
import { runApi } from "@/lib/api";
import { DRILL_DIFFICULTY_COLORS } from "@/lib/drill-definitions";
import type { Difficulty, FieldSpace, Intensity } from "@/types";

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

const updateDrill = createServerFn({ method: "POST" })
  .inputValidator((data: typeof UpdateDrillInput.Type) =>
    Schema.decodeSync(UpdateDrillInput)(data),
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
  const [categories, setCategories] = useState([...drill.category]);
  const [positionGroups, setPositionGroups] = useState([
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
        positionGroup: positionGroups,
        intensity: intensity || null,
        contact,
        competitive,
        playerCount: playerCount ? parseInt(playerCount, 10) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        fieldSpace: fieldSpace || null,
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
        onSave={() => {
          void handleSave();
        }}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {drill.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Drill details, coaching notes, and reusable setup information.
          </p>
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

      <div className="space-y-6">
        {/* Header info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={DRILL_DIFFICULTY_COLORS[drill.difficulty]}
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

interface DrillEditViewProps extends DrillFormFieldsProps {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function DrillEditView(props: DrillEditViewProps) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Edit Drill
          </h1>
          <p className="text-sm text-muted-foreground">
            Update the details, constraints, and coaching cues for this drill.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button onClick={props.onSave} disabled={props.saving || !props.name}>
            {props.saving ? <Loader2 className="animate-spin" /> : <Check />}
            {props.saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <DrillFormFields {...props} />
      </div>
    </div>
  );
}
