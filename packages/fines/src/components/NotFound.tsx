import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="page stack">
      <h1>404</h1>
      <p className="muted">That route does not exist.</p>
      <Link to="/">← Home</Link>
    </main>
  );
}
