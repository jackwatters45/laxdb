import { Separator } from "@laxdb/ui/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@laxdb/ui/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppBreadcrumbs } from "../components/app-breadcrumbs";
import { AppSidebar } from "../components/app-sidebar";
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

function AppShell() {
  const ctx = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = ctx.me;
  const canUseTeamApp = ctx.isAdmin || ctx.isCoach;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    queryClient.setQueryData(ME_QUERY_KEY, me);
    queryClient.setQueryData(["teams"], ctx.teams);
  }, [ctx.teams, me, queryClient]);

  const signOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(result.error.message ?? "Unable to sign out.");
        setIsSigningOut(false);
        return;
      }

      queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
      await router.navigate({ to: "/login" });
      await router.invalidate();
    } catch (cause) {
      setSignOutError(
        cause instanceof Error ? cause.message : "Unable to sign out.",
      );
      setIsSigningOut(false);
    }
  };

  if (!me) return null;

  const roleLabel = ctx.isAdmin
    ? (me.memberRole ?? "admin")
    : ctx.isCoach
      ? "coach"
      : "player";

  return (
    <SidebarProvider>
      <a
        className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href="#main-content"
      >
        Skip to main content
      </a>
      <AppSidebar
        canUseTeamApp={canUseTeamApp}
        isAdmin={ctx.isAdmin}
        isSigningOut={isSigningOut}
        me={me}
        onSignOut={() => {
          void signOut();
        }}
        roleLabel={roleLabel}
        signOutError={signOutError}
      />
      <SidebarInset id="main-content" tabIndex={-1}>
        <header className="sticky top-0 z-10 flex h-10 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:px-4">
          <SidebarTrigger size="icon-lg" className="-ml-1" />
          <Separator orientation="vertical" />
          <AppBreadcrumbs />
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
