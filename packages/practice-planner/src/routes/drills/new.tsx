import { RpcApiClient } from "@laxdb/api/client";
import { CreateDrillInput } from "@laxdb/core/drill/drill.schema";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { DrillFormFields } from "@/components/drill-form-fields";
import { runApi } from "@/lib/api";
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

const createDrill = createServerFn({ method: "POST" })
  .inputValidator((data: typeof CreateDrillInput.Type) =>
    Schema.decodeSync(CreateDrillInput)(data),
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
  const [positionGroups, setPositionGroups] = useState<PositionGroup[]>([]);
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
        positionGroup: positionGroups,
        intensity: intensity || null,
        contact,
        competitive,
        playerCount: playerCount ? parseInt(playerCount, 10) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        fieldSpace: fieldSpace || null,
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
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Drill
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture setup, coaching notes, and tags for a reusable drill.
        </p>
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
          <Button
            onClick={() => {
              void handleCreate();
            }}
            disabled={creating || !name}
          >
            {creating ? <Loader2 className="animate-spin" /> : null}
            {creating ? "Creating…" : "Create Drill"}
          </Button>
        </div>
      </div>
    </div>
  );
}
