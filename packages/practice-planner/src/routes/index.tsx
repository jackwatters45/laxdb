import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Practice Planner</h1>
        <p className="mt-2 text-muted-foreground">
          Visual practice planning for lacrosse coaches.
        </p>
      </div>
    </div>
  );
}
