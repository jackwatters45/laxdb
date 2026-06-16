import { Button } from "@laxdb/ui/components/ui/button";
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

const navLinkClass =
  "-mb-px border-b-2 border-transparent pb-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-primary data-[status=active]:text-foreground";

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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <strong className="text-sm font-semibold tracking-tight">
          Malvern Lacrosse
        </strong>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {me.userName}
            {me.memberRole && ` · ${me.memberRole}`}
          </span>
          <Button
            variant="outline"
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <nav className="flex items-center gap-5 border-b border-border">
        <Link to="/fixtures" className={navLinkClass}>
          Fixtures
        </Link>
        <Link to="/roster" className={navLinkClass}>
          Roster
        </Link>
        <Link to="/fines" className={navLinkClass}>
          Fines
        </Link>
        {isAdmin && (
          <Link to="/admin" className={navLinkClass}>
            Admin
          </Link>
        )}
        <Link to="/audit" className={navLinkClass}>
          Audit
        </Link>
      </nav>

      <Outlet />
    </main>
  );
}
