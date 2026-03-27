import { RpcApiClient } from "@laxdb/api-v2/client";
import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { ArrowLeft, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";

// ---------------------------------------------------------------------------
// Server function
// ---------------------------------------------------------------------------

// Client form shape — date is a string here, converted to Date in the handler.
// The RPC uses core-v2's CreatePracticeInput which expects Date.
const CreatePracticeForm = Schema.Struct({
  name: Schema.String,
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
          name: data.name || null,
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
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");

  const handleCreate = async () => {
    setCreating(true);
    const practice = await createPractice({
      data: {
        name: name || "Untitled Practice",
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
    <div className="min-h-dvh bg-background">
      <header className="flex items-center h-14 px-6 border-b border-border bg-card gap-3">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">New Practice</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Details */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All fields are optional — you can fill these in later.
            </p>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Practice Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                placeholder="e.g. Tuesday Team Practice"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">
                  <Calendar size={12} className="inline mr-1.5 -mt-0.5" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="duration">
                  <Clock size={12} className="inline mr-1.5 -mt-0.5" />
                  Duration (minutes)
                </Label>
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
              </div>
            </div>

            <div>
              <Label htmlFor="location">
                <MapPin size={12} className="inline mr-1.5 -mt-0.5" />
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                }}
                placeholder="e.g. Main Field"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                placeholder="Practice focus, goals, themes..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Templates */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Template</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose a starting structure for your practice.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id);
                }}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  selectedTemplate === template.id
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-foreground/20"
                }`}
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
        </section>

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
