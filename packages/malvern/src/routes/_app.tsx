import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
} from "@tanstack/react-router";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const ctx = Route.useRouteContext();
  const router = useRouter();
  const me = ctx.me;

  const signOut = async () => {
    await authClient.signOut();
    await router.invalidate();
    await router.navigate({ to: "/login" });
  };

  if (!me) return null;

  const isAdmin = me.memberRole === "owner" || me.memberRole === "admin";

  return (
    <main className="page stack">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <strong>Malvern Lacrosse Ops</strong>
        </div>
        <div className="row" style={{ gap: "0.75rem" }}>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            {me.userName}
            {me.memberRole && ` · ${me.memberRole}`}
          </span>
          <button
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="team-nav">
        <Link to="/top-three" activeProps={{ className: "active" }}>
          Top Three
        </Link>
        <Link to="/fixtures" activeProps={{ className: "active" }}>
          Fixtures
        </Link>
        <Link to="/fines" activeProps={{ className: "active" }}>
          Fines
        </Link>
        {isAdmin && (
          <>
            <Link to="/game-day-admin" activeProps={{ className: "active" }}>
              Game Day Admin
            </Link>
            <Link to="/admin" activeProps={{ className: "active" }}>
              Fines Admin
            </Link>
          </>
        )}
        <Link to="/audit" activeProps={{ className: "active" }}>
          Audit
        </Link>
      </nav>

      <Outlet />
    </main>
  );
}
