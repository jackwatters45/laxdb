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
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Trash2,
} from "lucide-react";

import { runApi } from "@/lib/api";
import { practiceName } from "@/lib/practice-name";

const listPractices = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.PracticeList();
    }),
  ),
);

const DeletePracticeInput = Schema.Struct({ publicId: Schema.String });

const deletePractice = createServerFn({ method: "POST" })
  .inputValidator((data: typeof DeletePracticeInput.Type) =>
    Schema.decodeSync(DeletePracticeInput)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PracticeDelete({ publicId: data.publicId });
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground">
          Practice Plans
        </h1>
        <Link to="/practice/new">
          <Button>
            <Plus />
            New Practice
          </Button>
        </Link>
      </div>

      <div>
        {practices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground text-pretty mb-4">
              No practices yet. Create your first practice plan.
            </p>
            <Link to="/practice/new">
              <Button>
                <Plus />
                New Practice
              </Button>
            </Link>
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
  const router = useRouter();

  const handleDelete = async () => {
    await deletePractice({ data: { publicId: practice.publicId } });
    await router.invalidate();
  };

  return (
    <div className="group flex items-center rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
      <Link
        to="/practice/$id"
        params={{ id: practice.publicId }}
        className="flex-1 flex items-center justify-between p-4 min-w-0"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {practiceName(practice)}
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
                Delete "{practiceName(practice)}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this practice plan and all its
                items. This action cannot be undone.
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
