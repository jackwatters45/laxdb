import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">404</h1>
      <p className="text-sm text-muted-foreground">
        That route does not exist.
      </p>
      <Link
        to="/"
        className="text-xs underline underline-offset-2 hover:text-muted-foreground"
      >
        ← Home
      </Link>
    </main>
  );
}
