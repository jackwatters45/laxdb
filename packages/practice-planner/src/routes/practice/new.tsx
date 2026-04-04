import { RpcApiClient } from "@laxdb/api-v2/client";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { cn } from "@laxdb/ui/lib/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { ArrowLeft, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const loadDefaults = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.PracticeGetDefaults();
    }),
  ),
);

// Client form shape — date is a string here, converted to Date in the handler.
// The RPC uses core-v2's CreatePracticeInput which expects Date.
const CreatePracticeForm = Schema.Struct({
  date: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  durationMinutes: Schema.NullOr(Schema.Number),
  location: Schema.NullOr(Schema.String),
});

const createPractice = createServerFn({ method: "POST" })
  .inputValidator((data: typeof CreatePracticeForm.Type) =>
    Schema.decodeSync(CreatePracticeForm)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PracticeCreate({
          name: null,
          date: data.date ? new Date(data.date) : null,
          description: data.description ?? null,
          notes: null,
          durationMinutes: data.durationMinutes,
          location: data.location ?? null,
        });
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/practice/new")({
  component: NewPracticePage,
  loader: () => loadDefaults(),
});

// ---------------------------------------------------------------------------
// Mock templates (will be replaced with real template system)
// ---------------------------------------------------------------------------

const TEMPLATES = [
  {
    id: "blank",
    name: "Blank Practice",
    description: "Start from scratch with an empty canvas.",
  },
  {
    id: "standard",
    name: "Standard Practice",
    description:
      "Warm-up → Drills → Water Break → Scrimmage → Cool-down. The classic 2-hour structure.",
  },
  {
    id: "game-prep",
    name: "Game Prep",
    description:
      "Light warm-up, walk-throughs, set plays, and a short scrimmage. For the day before a game.",
  },
  {
    id: "conditioning",
    name: "Conditioning Focus",
    description:
      "High-intensity drills with short rest. Ground balls, sprints, and competitive reps.",
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function NewPracticePage() {
  const navigate = useNavigate();
  const defaults = Route.useLoaderData();
  const [creating, setCreating] = useState(false);

  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(
    defaults?.durationMinutes?.toString() ?? "",
  );
  const [location, setLocation] = useState(defaults?.location ?? "");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");

  const handleCreate = async () => {
    setCreating(true);
    const practice = await createPractice({
      data: {
        date: date || null,
        description: description || null,
        durationMinutes: duration ? parseInt(duration, 10) : null,
        location: location || null,
      },
    });
    await navigate({
      to: "/practice/$id",
      params: { id: practice.publicId },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">New Practice</h1>
      </div>

      <div className="space-y-8">
        {/* Details */}
        <FieldSet>
          <FieldLegend>Details</FieldLegend>
          <FieldDescription className="-mt-1.5">
            All fields are optional — you can fill these in later.
          </FieldDescription>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="date">
                  <Calendar size={12} />
                  Date
                </FieldLabel>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="duration">
                  <Clock size={12} />
                  Duration (minutes)
                </FieldLabel>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                  }}
                  placeholder="120"
                  min={1}
                  max={300}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="location">
                <MapPin size={12} />
                Location
              </FieldLabel>
              <Input
                id="location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                }}
                placeholder="e.g. Main Field"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                placeholder="Practice focus, goals, themes..."
                className="min-h-[80px]"
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Templates */}
        <FieldSet>
          <FieldLegend>Template</FieldLegend>
          <FieldDescription className="-mt-1.5">
            Choose a starting structure for your practice.
          </FieldDescription>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSelectedTemplate(template.id);
                }}
                className={cn(
                  "text-left rounded-lg border p-4 transition-colors",
                  selectedTemplate === template.id
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-foreground/20",
                )}
              >
                <p className="text-sm font-medium text-foreground">
                  {template.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-pretty">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </FieldSet>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="animate-spin" /> : null}
            {creating ? "Creating…" : "Create Practice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
