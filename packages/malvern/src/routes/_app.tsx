import { Button } from "@laxdb/ui/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { authClient } from "../lib/auth-client";
import { listTeams } from "../lib/club";
import { ME_QUERY_KEY } from "../lib/session";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const me = context.me;
    if (!me) return { teams: [], isAdmin: false, isCoach: false };

    const teams = await context.queryClient.ensureQueryData({
      queryKey: ["teams"],
      queryFn: () => listTeams(),
    });
    const isAdmin = me.memberRole === "owner" || me.memberRole === "admin";
    const isCoach =
      me.activeMemberId !== null &&
      teams.some((team) => team.coachMemberId === me.activeMemberId);

    if (
      !isAdmin &&
      !isCoach &&
      location.pathname !== "/player" &&
      location.pathname !== "/profile"
    ) {
      throw redirect({ to: "/player" });
    }

    return { teams, isAdmin, isCoach };
  },
  component: AppShell,
});

const navLinkClass =
  "-mb-px border-b-2 border-transparent pb-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-primary data-[status=active]:text-foreground";

function AppShell() {
  const ctx = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = ctx.me;
  const canUseTeamApp = ctx.isAdmin || ctx.isCoach;

  useEffect(() => {
    queryClient.setQueryData(ME_QUERY_KEY, me);
    queryClient.setQueryData(["teams"], ctx.teams);
  }, [ctx.teams, me, queryClient]);

  const signOut = async () => {
    await authClient.signOut();
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    await router.invalidate();
    await router.navigate({ to: "/login" });
  };

  if (!me) return null;

  const roleLabel = ctx.isAdmin
    ? me.memberRole
    : ctx.isCoach
      ? "coach"
      : "player";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <strong className="text-sm font-semibold tracking-tight">
          Malvern Lacrosse
        </strong>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {me.userName.trim() === "" ? me.userEmail : me.userName} ·{" "}
            {roleLabel}
          </Link>
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
        {canUseTeamApp ? (
          <>
            <Link to="/fixtures" className={navLinkClass}>
              Fixtures
            </Link>
            <Link to="/roster" className={navLinkClass}>
              Roster
            </Link>
            {ctx.isAdmin && (
              <Link to="/admin" className={navLinkClass}>
                Admin
              </Link>
            )}
          </>
        ) : (
          <Link to="/player" className={navLinkClass}>
            Player
          </Link>
        )}
      </nav>

      <Outlet />
    </main>
  );
}
