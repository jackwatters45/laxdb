import { RpcApiClient } from "@laxdb/api/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@laxdb/ui/components/ui/alert-dialog";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import {
  Clock,
  Flame,
  Plus,
  Search,
  Snowflake,
  Target,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
import type { Drill, Difficulty } from "@/types";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const listDrills = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.DrillList();
    }),
  ),
);

const DeleteDrillInput = Schema.Struct({ publicId: Schema.String });

const deleteDrill = createServerFn({ method: "POST" })
  .inputValidator((data: typeof DeleteDrillInput.Type) =>
    Schema.decodeSync(DeleteDrillInput)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DrillDelete({ publicId: data.publicId });
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/drills/")({
  component: DrillsListPage,
  loader: () => listDrills(),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "all", label: "All" },
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
] as const;

const DIFFICULTIES = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const isDrillListCategory = (
  value: string,
): value is (typeof CATEGORIES)[number]["value"] =>
  CATEGORIES.some((category) => category.value === value);

const isDifficultyFilter = (
  value: string,
): value is (typeof DIFFICULTIES)[number]["value"] =>
  DIFFICULTIES.some((difficulty) => difficulty.value === value);

const difficultyColors: Record<Difficulty, string> = {
  beginner: "bg-green-500/10 text-green-600",
  intermediate: "bg-amber-500/10 text-amber-600",
  advanced: "bg-red-500/10 text-red-600",
};

const intensityIcons: Record<string, typeof Zap> = {
  low: Snowflake,
  medium: Flame,
  high: Zap,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DrillsListPage() {
  const drills = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<(typeof CATEGORIES)[number]["value"]>("all");
  const [activeDifficulty, setActiveDifficulty] =
    useState<(typeof DIFFICULTIES)[number]["value"]>("all");

  const filtered = drills.filter((drill) => {
    const matchesSearch =
      !search ||
      drill.name.toLowerCase().includes(search.toLowerCase()) ||
      (drill.subtitle?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      drill.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      activeCategory === "all" || drill.category.includes(activeCategory);

    const matchesDifficulty =
      activeDifficulty === "all" || drill.difficulty === activeDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Group drills by category for display
  const warmups = filtered.filter((d) => d.tags.includes("warmup"));
  const cooldowns = filtered.filter((d) => d.tags.includes("cooldown"));
  const coreDrills = filtered.filter(
    (d) => !d.tags.includes("warmup") && !d.tags.includes("cooldown"),
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Drill Bank</h1>
        <Link to="/drills/new">
          <Button>
            <Plus />
            New Drill
          </Button>
        </Link>
      </div>

      <div className="space-y-5">
        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search drills..."
              className="pl-8"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <ToggleGroup
              value={[activeCategory]}
              onValueChange={(values) => {
                const next = values[0];
                if (next && isDrillListCategory(next)) setActiveCategory(next);
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap"
            >
              {CATEGORIES.map((cat) => (
                <ToggleGroupItem key={cat.value} value={cat.value}>
                  {cat.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <ToggleGroup
              value={[activeDifficulty]}
              onValueChange={(values) => {
                const next = values[0];
                if (next && isDifficultyFilter(next)) setActiveDifficulty(next);
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap"
            >
              {DIFFICULTIES.map((d) => (
                <ToggleGroupItem key={d.value} value={d.value}>
                  {d.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} drill{filtered.length === 1 ? "" : "s"}
          {search || activeCategory !== "all" || activeDifficulty !== "all"
            ? " matching filters"
            : ""}
        </p>

        {/* Drill list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground text-pretty mb-4">
              {drills.length === 0
                ? "No drills yet. Create your first drill."
                : "No drills match your filters."}
            </p>
            {drills.length === 0 && (
              <Link to="/drills/new">
                <Button>
                  <Plus />
                  New Drill
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {warmups.length > 0 && (
              <DrillGroup title="Warm-ups" drills={warmups} icon={Flame} />
            )}
            {coreDrills.length > 0 && (
              <DrillGroup title="Drills" drills={coreDrills} icon={Target} />
            )}
            {cooldowns.length > 0 && (
              <DrillGroup
                title="Cool-downs"
                drills={cooldowns}
                icon={Snowflake}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function DrillGroup({
  title,
  drills,
  icon: Icon,
}: {
  title: string;
  drills: readonly Drill[];
  icon: typeof Target;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">({drills.length})</span>
      </div>
      <div className="flex flex-col gap-2">
        {drills.map((drill) => (
          <DrillCard key={drill.publicId} drill={drill} />
        ))}
      </div>
    </section>
  );
}

function DrillCard({ drill }: { drill: Drill }) {
  const router = useRouter();
  const IntensityIcon = drill.intensity
    ? intensityIcons[drill.intensity]
    : null;

  const handleDelete = async () => {
    await deleteDrill({ data: { publicId: drill.publicId } });
    await router.invalidate();
  };

  return (
    <div className="group flex items-center rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
      <Link
        to="/drills/$id"
        params={{ id: drill.publicId }}
        className="flex-1 flex items-center justify-between p-4 min-w-0"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Name + difficulty */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {drill.name}
            </span>
            <Badge
              variant="secondary"
              className={difficultyColors[drill.difficulty]}
            >
              {drill.difficulty}
            </Badge>
          </div>

          {/* Subtitle */}
          {drill.subtitle && (
            <p className="text-xs text-muted-foreground/70 truncate">
              {drill.subtitle}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {drill.durationMinutes && (
              <span className="flex items-center gap-1 tabular-nums">
                <Clock size={12} />
                {drill.durationMinutes} min
              </span>
            )}
            {IntensityIcon && drill.intensity && (
              <span className="flex items-center gap-1">
                <IntensityIcon size={12} />
                {drill.intensity}
              </span>
            )}
            {drill.playerCount && (
              <span className="flex items-center gap-1 tabular-nums">
                <Users size={12} />
                {drill.playerCount}+
              </span>
            )}
          </div>

          {/* Categories + tags */}
          {(drill.category.length > 0 || drill.tags.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {drill.category.map((cat) => (
                <Badge key={cat} variant="outline" className="text-[10px] h-5">
                  {cat}
                </Badge>
              ))}
              {drill.tags
                .filter((t) => t !== "warmup" && t !== "cooldown")
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] h-5 text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          )}
        </div>
      </Link>

      {/* Delete */}
      <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            }
          >
            <Trash2 size={14} />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &quot;{drill.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this drill. Any practice plans
                referencing it will keep their items but lose the drill
                association.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                render={<Button variant="destructive" />}
                onClick={() => {
                  void handleDelete();
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
