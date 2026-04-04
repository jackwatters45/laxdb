import { RpcApiClient } from "@laxdb/api/client";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
import { DrillFormFields } from "@/routes/drills/$id";
import type {
  Difficulty,
  DrillCategory,
  FieldSpace,
  Intensity,
  PositionGroup,
} from "@/types";

// ---------------------------------------------------------------------------
// Server function
// ---------------------------------------------------------------------------

const CreateDrillForm = Schema.Struct({
  name: Schema.String,
  subtitle: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
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
  intensity: Schema.NullOr(Schema.Literals(["low", "medium", "high"])),
  contact: Schema.NullOr(Schema.Boolean),
  competitive: Schema.NullOr(Schema.Boolean),
  playerCount: Schema.NullOr(Schema.Number),
  durationMinutes: Schema.NullOr(Schema.Number),
  fieldSpace: Schema.NullOr(
    Schema.Literals(["full-field", "half-field", "box"]),
  ),
  equipment: Schema.NullOr(Schema.Array(Schema.String)),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
  coachNotes: Schema.NullOr(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
});

const createDrill = createServerFn({ method: "POST" })
  .inputValidator((data: typeof CreateDrillForm.Type) =>
    Schema.decodeSync(CreateDrillForm)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DrillCreate(data);
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/drills/new")({
  component: NewDrillPage,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function NewDrillPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [categories, setCategories] = useState<DrillCategory[]>([]);
  const [positionGroups, setPositionGroups] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<Intensity | "">("");
  const [contact, setContact] = useState(false);
  const [competitive, setCompetitive] = useState(false);
  const [playerCount, setPlayerCount] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [fieldSpace, setFieldSpace] = useState<FieldSpace | "">("");
  const [coachNotes, setCoachNotes] = useState("");
  const [tags, setTags] = useState("");

  const handleCreate = async () => {
    if (!name) return;
    setCreating(true);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const drill = await createDrill({
      data: {
        name,
        subtitle: subtitle || null,
        description: description || null,
        difficulty,
        category: categories,
        positionGroup: positionGroups as PositionGroup[],
        intensity: (intensity as Intensity) || null,
        contact,
        competitive,
        playerCount: playerCount ? parseInt(playerCount, 10) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        fieldSpace: (fieldSpace as FieldSpace) || null,
        equipment: null,
        diagramUrl: null,
        videoUrl: null,
        coachNotes: coachNotes || null,
        tags: parsedTags,
      },
    });

    await navigate({
      to: "/drills/$id",
      params: { id: drill.publicId },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/drills"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">New Drill</h1>
      </div>

      <div className="space-y-8">
        <DrillFormFields
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
        />

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link to="/drills">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button onClick={handleCreate} disabled={creating || !name}>
            {creating ? <Loader2 className="animate-spin" /> : null}
            {creating ? "Creating…" : "Create Drill"}
          </Button>
        </div>
      </div>
    </div>
  );
}
