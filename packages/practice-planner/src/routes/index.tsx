import { RpcApiClient } from "@laxdb/api-v2/client";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";
import { Plus, Calendar, Clock, MapPin, ChevronRight } from "lucide-react";

import { runApi } from "@/lib/api";

const listPractices = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.PracticeList();
    }),
  ),
);

const createPractice = createServerFn({ method: "POST" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.PracticeCreate({
        name: "Untitled Practice",
        date: null,
        description: null,
        notes: null,
        durationMinutes: null,
        location: null,
      });
    }),
  ),
);

export const Route = createFileRoute("/")({
  component: PracticeListPage,
  loader: () => listPractices(),
});

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-500",
  "in-progress": "bg-amber-500/10 text-amber-500",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-destructive/10 text-destructive",
};

function PracticeListPage() {
  const practices = Route.useLoaderData();
  const navigate = useNavigate();

  const handleCreate = async () => {
    const practice = await createPractice();
    await navigate({ to: "/practice/$id", params: { id: practice.publicId } });
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground">
          Practice Plans
        </h1>
        <Button onClick={handleCreate}>
          <Plus />
          New Practice
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {practices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground text-pretty mb-4">
              No practices yet. Create your first practice plan.
            </p>
            <Button onClick={handleCreate}>
              <Plus />
              New Practice
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {practices.map((practice) => (
              <PracticeCard key={practice.publicId} practice={practice} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeCard({
  practice,
}: {
  practice: (typeof Route.types.loaderData)[number];
}) {
  return (
    <Link
      to="/practice/$id"
      params={{ id: practice.publicId }}
      className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-foreground/20 transition-colors"
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            {practice.name ?? "Untitled Practice"}
          </span>
          <Badge
            variant="secondary"
            className={statusColors[practice.status] ?? ""}
          >
            {practice.status}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {practice.date && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(practice.date).toLocaleDateString()}
            </span>
          )}
          {practice.durationMinutes && (
            <span className="flex items-center gap-1 tabular-nums">
              <Clock size={12} />
              {practice.durationMinutes} min
            </span>
          )}
          {practice.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {practice.location}
            </span>
          )}
        </div>

        {practice.description && (
          <p className="text-xs text-muted-foreground/70 truncate text-pretty">
            {practice.description}
          </p>
        )}
      </div>

      <ChevronRight
        size={16}
        className="flex-shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
      />
    </Link>
  );
}
