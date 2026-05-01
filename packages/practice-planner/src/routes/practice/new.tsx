import { RpcApiClient } from "@laxdb/api/client";
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
import { voidAsync } from "@laxdb/ui/lib/void-async";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
import { decodePracticeDefaults, practiceDefaultsScope } from "@/lib/defaults";
import type { PracticeItemPriority, PracticeItemType } from "@/types";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const loadDefaults = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const values = yield* client.DefaultsGetNamespace(practiceDefaultsScope);
      return decodePracticeDefaults(values);
    }),
  ),
);

const PracticeTemplateId = Schema.Literals([
  "blank",
  "standard",
  "game-prep",
  "conditioning",
]);

type PracticeTemplateId = typeof PracticeTemplateId.Type;

interface PracticeTemplateItem {
  type: PracticeItemType;
  label: string;
  durationMinutes: number;
  notes: string | null;
  priority: PracticeItemPriority;
}

interface PracticeTemplate {
  id: PracticeTemplateId;
  name: string;
  description: string;
  items: readonly PracticeTemplateItem[];
}

interface PracticeTemplateEdge {
  sourcePublicId: string;
  targetPublicId: string;
  label: null;
}

const blankTemplate: PracticeTemplate = {
  id: "blank",
  name: "Blank Practice",
  description: "Start from scratch with an empty canvas.",
  items: [],
};

const TEMPLATES: readonly PracticeTemplate[] = [
  blankTemplate,
  {
    id: "standard",
    name: "Standard Practice",
    description:
      "Warm-up → Drills → Water Break → Scrimmage → Cool-down. The classic 2-hour structure.",
    items: [
      {
        type: "warmup",
        label: "Dynamic Warm-up",
        durationMinutes: 10,
        notes: "Mobility, stickwork, and activation before intensity ramps up.",
        priority: "required",
      },
      {
        type: "drill",
        label: "Stickwork + Passing",
        durationMinutes: 15,
        notes: "Clean touches, spacing, communication, and tempo.",
        priority: "required",
      },
      {
        type: "drill",
        label: "Skill Development Block",
        durationMinutes: 25,
        notes: "Core teaching segment for the day's main focus.",
        priority: "required",
      },
      {
        type: "water-break",
        label: "Water Break",
        durationMinutes: 5,
        notes: null,
        priority: "required",
      },
      {
        type: "activity",
        label: "Team Concepts",
        durationMinutes: 25,
        notes: "Sixes, clears/rides, settled offense, or defensive rotations.",
        priority: "required",
      },
      {
        type: "activity",
        label: "Controlled Scrimmage",
        durationMinutes: 30,
        notes: "Constrained scrimmage with coaching stoppages.",
        priority: "optional",
      },
      {
        type: "cooldown",
        label: "Cool-down + Review",
        durationMinutes: 10,
        notes: "Stretch, recap, and next-practice expectations.",
        priority: "required",
      },
    ],
  },
  {
    id: "game-prep",
    name: "Game Prep",
    description:
      "Light warm-up, walk-throughs, set plays, and a short scrimmage. For the day before a game.",
    items: [
      {
        type: "warmup",
        label: "Light Activation",
        durationMinutes: 10,
        notes: "Stay sharp without adding fatigue.",
        priority: "required",
      },
      {
        type: "drill",
        label: "Clean Touches",
        durationMinutes: 15,
        notes: "High-completion stickwork and finishing reps.",
        priority: "required",
      },
      {
        type: "activity",
        label: "Ride/Clear Walk-through",
        durationMinutes: 20,
        notes: "Assignments, lanes, outlets, and substitution timing.",
        priority: "required",
      },
      {
        type: "activity",
        label: "Special Teams",
        durationMinutes: 20,
        notes: "Man-up, man-down, face-off wing roles, and end-line plays.",
        priority: "required",
      },
      {
        type: "activity",
        label: "Set Plays + Situations",
        durationMinutes: 25,
        notes:
          "Review calls, counters, sideline restarts, and final-minute plans.",
        priority: "required",
      },
      {
        type: "activity",
        label: "Short Controlled Scrimmage",
        durationMinutes: 15,
        notes: "Game-speed decisions with a hard stop before fatigue builds.",
        priority: "optional",
      },
      {
        type: "cooldown",
        label: "Scouting Review",
        durationMinutes: 10,
        notes: "Opponent reminders, roles, and player questions.",
        priority: "required",
      },
    ],
  },
  {
    id: "conditioning",
    name: "Conditioning Focus",
    description:
      "High-intensity drills with short rest. Ground balls, sprints, and competitive reps.",
    items: [
      {
        type: "warmup",
        label: "Dynamic Warm-up",
        durationMinutes: 10,
        notes: "Movement prep with progressive sprint build-ups.",
        priority: "required",
      },
      {
        type: "drill",
        label: "Ground Ball Circuit",
        durationMinutes: 20,
        notes:
          "Compete through contact, win the first three steps, outlet cleanly.",
        priority: "required",
      },
      {
        type: "drill",
        label: "Transition Sprint Drill",
        durationMinutes: 20,
        notes: "Condition through lacrosse actions instead of empty running.",
        priority: "required",
      },
      {
        type: "water-break",
        label: "Water Break",
        durationMinutes: 5,
        notes: "Short reset. Keep it tight.",
        priority: "required",
      },
      {
        type: "drill",
        label: "Competitive Dodging Lanes",
        durationMinutes: 20,
        notes: "High-rep dodges, recoveries, and second-effort finishes.",
        priority: "required",
      },
      {
        type: "activity",
        label: "Full-field Conditioning Game",
        durationMinutes: 25,
        notes: "Small-sided, continuous-play scoring game with fast restarts.",
        priority: "optional",
      },
      {
        type: "cooldown",
        label: "Cool-down + Recovery",
        durationMinutes: 10,
        notes: "Breathing, mobility, and hydration reminders.",
        priority: "required",
      },
    ],
  },
];

function getTemplate(templateId: PracticeTemplateId): PracticeTemplate {
  for (const template of TEMPLATES) {
    if (template.id === templateId) return template;
  }
  return blankTemplate;
}

// Client form shape — date is a string here, converted to Date in the handler.
// The RPC uses core's CreatePracticeInput which expects Date.
const CreatePracticeForm = Schema.Struct({
  date: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  durationMinutes: Schema.NullOr(Schema.Number),
  location: Schema.NullOr(Schema.String),
  templateId: PracticeTemplateId,
});

const createPractice = createServerFn({ method: "POST" })
  .inputValidator((data: typeof CreatePracticeForm.Type) =>
    Schema.decodeSync(CreatePracticeForm)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const practice = yield* client.PracticeCreate({
          name: null,
          date: data.date ? new Date(data.date) : null,
          description: data.description ?? null,
          notes: null,
          durationMinutes: data.durationMinutes,
          location: data.location ?? null,
        });

        const template = getTemplate(data.templateId);
        const createdItemIds: string[] = [];

        for (
          let orderIndex = 0;
          orderIndex < template.items.length;
          orderIndex++
        ) {
          const item = template.items[orderIndex];
          if (!item) continue;

          const createdItem = yield* client.PracticeAddItem({
            practicePublicId: practice.publicId,
            type: item.type,
            variant: "default",
            drillPublicId: null,
            label: item.label,
            durationMinutes: item.durationMinutes,
            notes: item.notes,
            groups: ["all"],
            orderIndex,
            positionX: 0,
            positionY: orderIndex * 140,
            priority: item.priority,
          });
          createdItemIds.push(createdItem.publicId);
        }

        const edges: PracticeTemplateEdge[] = [];
        for (let i = 0; i < createdItemIds.length - 1; i++) {
          const source = createdItemIds[i];
          const target = createdItemIds[i + 1];
          if (!source || !target) continue;
          edges.push({
            sourcePublicId: source,
            targetPublicId: target,
            label: null,
          });
        }

        yield* client.PracticeReplaceEdges({
          practicePublicId: practice.publicId,
          edges,
        });

        return practice;
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
// Page
// ---------------------------------------------------------------------------

function NewPracticePage() {
  const navigate = useNavigate();
  const defaults = Route.useLoaderData();
  const [creating, setCreating] = useState(false);

  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(
    defaults.durationMinutes?.toString() ?? "",
  );
  const [location, setLocation] = useState(defaults.location ?? "");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<PracticeTemplateId>("blank");

  const handleCreate = async () => {
    setCreating(true);
    const practice = await createPractice({
      data: {
        date: date || null,
        description: description || null,
        durationMinutes: duration ? parseInt(duration, 10) : null,
        location: location || null,
        templateId: selectedTemplate,
      },
    });
    await navigate({
      to: "/practice/$id",
      params: { id: practice.publicId },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Practice
        </h1>
        <p className="text-sm text-muted-foreground">
          Start a fresh practice plan and fill in the details as you go.
        </p>
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
          <Button onClick={voidAsync(handleCreate)} disabled={creating}>
            {creating ? <Loader2 className="animate-spin" /> : null}
            {creating ? "Creating…" : "Create Practice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
