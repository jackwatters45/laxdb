import { RpcApiClient } from "@laxdb/api-v2/client";
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
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  Shield,
  Swords,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
import type { Play, PlayCategory } from "@/types";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const listPlays = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.PlayList();
    }),
  ),
);

const DeletePlayInput = Schema.Struct({ publicId: Schema.String });

const deletePlay = createServerFn({ method: "POST" })
  .inputValidator((data: typeof DeletePlayInput.Type) =>
    Schema.decodeSync(DeletePlayInput)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PlayDelete({ publicId: data.publicId });
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/playbook/")(
  {
    component: PlaybookListPage,
    loader: () => listPlays(),
  },
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "offense", label: "Offense" },
  { value: "defense", label: "Defense" },
  { value: "clear", label: "Clear" },
  { value: "ride", label: "Ride" },
  { value: "faceoff", label: "Face-off" },
  { value: "emo", label: "EMO" },
  { value: "man-down", label: "Man-Down" },
  { value: "transition", label: "Transition" },
] as const;

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

const categoryIcons: Record<PlayCategory, typeof Swords> = {
  offense: Swords,
  defense: Shield,
  clear: Swords,
  ride: Swords,
  faceoff: Swords,
  emo: Swords,
  "man-down": Shield,
  transition: Swords,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PlaybookListPage() {
  const plays = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = plays.filter((play) => {
    const matchesSearch =
      !search ||
      play.name.toLowerCase().includes(search.toLowerCase()) ||
      (play.formation?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      play.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      activeCategory === "all" || play.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const grouped = CATEGORIES.filter((c) => c.value !== "all").reduce(
    (acc, cat) => {
      const matching = filtered.filter((p) => p.category === cat.value);
      if (matching.length > 0) acc.push({ label: cat.label, plays: matching });
      return acc;
    },
    [] as { label: string; plays: readonly Play[] }[],
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center h-14 px-6 border-b border-border bg-card gap-3">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Playbook</h1>
        <div className="flex-1" />
        <Link to="/playbook/new">
          <Button>
            <Plus />
            New Play
          </Button>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search plays..."
              className="pl-8"
            />
          </div>

          <ToggleGroup
            value={[activeCategory]}
            onValueChange={(values) => {
              const next = values[0] as string | undefined;
              if (next) setActiveCategory(next);
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
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} play{filtered.length !== 1 ? "s" : ""}
          {search || activeCategory !== "all" ? " matching filters" : ""}
        </p>

        {/* Play list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground text-pretty mb-4">
              {plays.length === 0
                ? "No plays yet. Create your first play."
                : "No plays match your filters."}
            </p>
            {plays.length === 0 && (
              <Link to="/playbook/new">
                <Button>
                  <Plus />
                  New Play
                </Button>
              </Link>
            )}
          </div>
        ) : activeCategory !== "all" ? (
          <div className="flex flex-col gap-2">
            {filtered.map((play) => (
              <PlayCard key={play.publicId} play={play} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <PlayGroup
                key={group.label}
                title={group.label}
                plays={group.plays}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function PlayGroup({
  title,
  plays,
}: {
  title: string;
  plays: readonly Play[];
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={14} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">({plays.length})</span>
      </div>
      <div className="flex flex-col gap-2">
        {plays.map((play) => (
          <PlayCard key={play.publicId} play={play} />
        ))}
      </div>
    </section>
  );
}

function PlayCard({ play }: { play: Play }) {
  const router = useRouter();

  const handleDelete = async () => {
    await deletePlay({ data: { publicId: play.publicId } });
    await router.invalidate();
  };

  return (
    <div className="group flex items-center rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
      <Link
        to="/playbook/$id"
        params={{ id: play.publicId }}
        className="flex-1 flex items-center justify-between p-4 min-w-0"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Name + category */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {play.name}
            </span>
            <Badge
              variant="secondary"
              className={categoryColors[play.category]}
            >
              {play.category}
            </Badge>
          </div>

          {/* Formation */}
          {play.formation && (
            <p className="text-xs text-muted-foreground/70 truncate">
              Formation: {play.formation}
            </p>
          )}

          {/* Tags */}
          {play.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {play.tags.map((tag) => (
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
              <AlertDialogTitle>Delete "{play.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this play from your playbook.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                render={<Button variant="destructive" />}
                onClick={handleDelete}
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
