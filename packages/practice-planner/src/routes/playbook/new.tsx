import { RpcApiClient } from "@laxdb/api/client";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
import { PlayFormFields } from "@/routes/playbook/$id";
import type { PlayCategory } from "@/types";

// ---------------------------------------------------------------------------
// Server function
// ---------------------------------------------------------------------------

const CreatePlayForm = Schema.Struct({
  name: Schema.String,
  category: Schema.Literals([
    "offense",
    "defense",
    "clear",
    "ride",
    "faceoff",
    "emo",
    "man-down",
    "transition",
  ]),
  formation: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  personnelNotes: Schema.NullOr(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
});

const createPlay = createServerFn({ method: "POST" })
  .inputValidator((data: typeof CreatePlayForm.Type) =>
    Schema.decodeSync(CreatePlayForm)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PlayCreate(data);
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/playbook/new")({
  component: NewPlayPage,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function NewPlayPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlayCategory>("offense");
  const [formation, setFormation] = useState("");
  const [description, setDescription] = useState("");
  const [personnelNotes, setPersonnelNotes] = useState("");
  const [tags, setTags] = useState("");
  const [diagramUrl, setDiagramUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleCreate = async () => {
    if (!name) return;
    setCreating(true);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const play = await createPlay({
      data: {
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

    await navigate({
      to: "/playbook/$id",
      params: { id: play.publicId },
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            New Play
          </h1>
          <p className="text-sm text-muted-foreground">
            Save the formation, coaching notes, and reference links for a set.
          </p>
        </div>
        <PlayFormFields
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
        />

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link to="/playbook">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            onClick={() => {
              void handleCreate();
            }}
            disabled={creating || !name}
          >
            {creating ? <Loader2 className="animate-spin" /> : null}
            {creating ? "Creating…" : "Create Play"}
          </Button>
        </div>
      </div>
    </div>
  );
}
