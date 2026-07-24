import type { Me } from "@laxdb/core/auth/auth.schema";
import { Avatar, AvatarFallback } from "@laxdb/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@laxdb/ui/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@laxdb/ui/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  CalendarDays,
  ChartBar,
  Check,
  ChevronsUpDown,
  CircleUserRound,
  FileText,
  House,
  Images,
  Landmark,
  LogOut,
  Settings,
  Shield,
  Trophy,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { TeamView } from "../lib/club";
import { getFixture } from "../lib/matches";

const allTeamsNavigation = [
  { to: "/teams", label: "Teams", icon: Shield },
  { to: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/photos", label: "Photos", icon: Images },
] satisfies ReadonlyArray<GlobalNavigationItem>;

const adminNavigation = [
  { to: "/admin", label: "Admin", icon: Settings },
] satisfies ReadonlyArray<GlobalNavigationItem>;

const playerNavigation = [
  { to: "/player", label: "Player", icon: UserRound },
] satisfies ReadonlyArray<GlobalNavigationItem>;

const teamNavigation = [
  { to: "/teams/$teamId", label: "Overview", icon: House, section: null },
  {
    to: "/teams/$teamId/fixtures",
    label: "Fixtures",
    icon: CalendarDays,
    section: "fixtures",
  },
  {
    to: "/teams/$teamId/reports",
    label: "Reports",
    icon: FileText,
    section: "reports",
  },
  {
    to: "/teams/$teamId/photos",
    label: "Photos",
    icon: Images,
    section: "photos",
  },
  {
    to: "/teams/$teamId/roster",
    label: "Roster",
    icon: UsersRound,
    section: "roster",
  },
  {
    to: "/teams/$teamId/standings",
    label: "Standings",
    icon: Trophy,
    section: "standings",
  },
  {
    to: "/teams/$teamId/stats",
    label: "Stats",
    icon: ChartBar,
    section: "stats",
  },
] as const;

type GlobalNavigationItem = {
  readonly to:
    | "/admin"
    | "/fixtures"
    | "/photos"
    | "/player"
    | "/reports"
    | "/teams";
  readonly label: string;
  readonly icon: LucideIcon;
};

type AppSidebarProps = {
  readonly canUseTeamApp: boolean;
  readonly isAdmin: boolean;
  readonly isSigningOut: boolean;
  readonly me: Me;
  readonly onSignOut: () => void;
  readonly roleLabel: string;
  readonly signOutError: string | null;
  readonly teams: ReadonlyArray<TeamView>;
};

type NavigationGroupProps = {
  readonly label: string;
  readonly items: ReadonlyArray<GlobalNavigationItem>;
};

const pathSegments = (pathname: string) =>
  pathname.split("/").filter((segment) => segment !== "");

const teamIdFromPath = (pathname: string) => {
  const segments = pathSegments(pathname);
  return segments[0] === "teams" ? (segments[1] ?? null) : null;
};

const fixtureIdFromPath = (pathname: string) => {
  const segments = pathSegments(pathname);
  return segments[0] === "fixtures" ? (segments[1] ?? null) : null;
};

const sectionFromPath = (pathname: string) => {
  const segments = pathSegments(pathname);
  if (segments[0] === "fixtures") return "fixtures";
  if (segments[0] === "reports") return "reports";
  if (segments[0] === "photos") return "photos";
  if (segments[0] === "roster") return "roster";
  if (segments[0] !== "teams") return null;
  const section = segments[2];
  if (
    section === "fixtures" ||
    section === "reports" ||
    section === "photos" ||
    section === "roster" ||
    section === "standings" ||
    section === "stats"
  ) {
    return section;
  }
  return null;
};

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- GlobalNavigationItem is readonly; Lucide's component type is not.
function NavigationGroup(props: Readonly<NavigationGroupProps>) {
  const { label, items } = props;
  const { pathname } = useLocation();
  const { setOpenMobile, state } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="h-6">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- GlobalNavigationItem is readonly; Lucide's component type is not. */}
          {items.map((item: GlobalNavigationItem) => {
            const { to, label: itemLabel, icon: Icon } = item;
            const isActive =
              pathname === to ||
              (to === "/fixtures" && pathname.startsWith("/fixtures/"));

            return (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  render={
                    <Link
                      to={to}
                      aria-label={itemLabel}
                      title={state === "collapsed" ? itemLabel : undefined}
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    />
                  }
                  isActive={isActive}
                >
                  <Icon aria-hidden="true" />
                  <span>{itemLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function TeamNavigationGroup({
  fixtureTeamId,
  teamId,
}: {
  readonly fixtureTeamId: string | null;
  readonly teamId: string;
}) {
  const { pathname } = useLocation();
  const { setOpenMobile, state } = useSidebar();
  const activeSection = sectionFromPath(pathname);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="h-6">Team</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {teamNavigation.map((item) => {
            const Icon = item.icon;
            const isFixtureDetail =
              pathname.startsWith("/fixtures/") && fixtureTeamId === teamId;
            const isActive =
              item.section === null
                ? pathname === `/teams/${teamId}`
                : (activeSection === item.section &&
                    pathname.startsWith(`/teams/${teamId}/`)) ||
                  (item.section === "fixtures" && isFixtureDetail);

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  render={
                    <Link
                      to={item.to}
                      params={{ teamId }}
                      aria-label={item.label}
                      title={state === "collapsed" ? item.label : undefined}
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    />
                  }
                  isActive={isActive}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const displayNameFor = (me: Me) =>
  me.userName.trim() === "" ? me.userEmail : me.userName;

const initialsFor = (name: string) => {
  const initials = name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "ML";
};

function WorkspaceSwitcher({
  activeTeam,
  allTeamsLabel,
  isAllTeamsAvailable,
  pathname,
  teams,
}: {
  readonly activeTeam: TeamView | null;
  readonly allTeamsLabel: string;
  readonly isAllTeamsAvailable: boolean;
  readonly pathname: string;
  readonly teams: ReadonlyArray<TeamView>;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const router = useRouter();
  const section = sectionFromPath(pathname);

  const navigateToTeam = (teamId: string) => {
    setOpenMobile(false);
    if (section === "fixtures") {
      void router.navigate({
        to: "/teams/$teamId/fixtures",
        params: { teamId },
      });
    } else if (section === "reports") {
      void router.navigate({
        to: "/teams/$teamId/reports",
        params: { teamId },
      });
    } else if (section === "photos") {
      void router.navigate({
        to: "/teams/$teamId/photos",
        params: { teamId },
      });
    } else if (section === "roster") {
      void router.navigate({
        to: "/teams/$teamId/roster",
        params: { teamId },
      });
    } else if (section === "standings") {
      void router.navigate({
        to: "/teams/$teamId/standings",
        params: { teamId },
      });
    } else if (section === "stats") {
      void router.navigate({
        to: "/teams/$teamId/stats",
        params: { teamId },
      });
    } else {
      void router.navigate({ to: "/teams/$teamId", params: { teamId } });
    }
  };

  const navigateToAllTeams = () => {
    setOpenMobile(false);
    if (section === "fixtures") {
      void router.navigate({ to: "/fixtures" });
    } else if (section === "reports") {
      void router.navigate({ to: "/reports" });
    } else if (section === "photos") {
      void router.navigate({ to: "/photos" });
    } else {
      void router.navigate({ to: "/teams" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="h-10 p-1 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            aria-label={`Switch workspace. Current workspace: ${activeTeam?.name ?? allTeamsLabel}`}
          />
        }
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Landmark aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
          <strong className="truncate text-xs font-semibold">
            Malvern Lacrosse
          </strong>
          <span className="truncate text-xs text-sidebar-foreground/60">
            {activeTeam?.name ?? allTeamsLabel}
          </span>
        </span>
        <ChevronsUpDown
          className="ml-auto group-data-[collapsible=icon]:hidden"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={8}
        className="w-64"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        </DropdownMenuGroup>
        {isAllTeamsAvailable ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={navigateToAllTeams}>
                <UsersRound aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{allTeamsLabel}</span>
                {activeTeam === null ? <Check aria-hidden="true" /> : null}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuGroup>
          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => {
                navigateToTeam(team.id);
              }}
            >
              <Shield aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{team.name}</span>
              {activeTeam?.id === team.id ? <Check aria-hidden="true" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar({
  canUseTeamApp,
  isAdmin,
  isSigningOut,
  me,
  onSignOut,
  roleLabel,
  signOutError,
  teams,
}: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { pathname } = useLocation();
  const displayName = displayNameFor(me);
  const routeTeamId = teamIdFromPath(pathname);
  const fixtureId = fixtureIdFromPath(pathname);
  const fixtureQuery = useQuery({
    queryKey: ["fixture", fixtureId],
    queryFn: () =>
      fixtureId === null
        ? Promise.reject(new Error("Fixture ID is required"))
        : getFixture({ data: { id: fixtureId } }),
    enabled: fixtureId !== null,
  });
  const fixtureTeamId = fixtureQuery.data?.teamId ?? null;
  const activeTeamId = routeTeamId ?? fixtureTeamId;
  const availableTeams = isAdmin
    ? teams
    : teams.filter((team) => team.coachMemberId === me.activeMemberId);
  const activeTeam =
    availableTeams.find((team) => team.id === activeTeamId) ?? null;
  const allTeamsLabel = isAdmin ? "All club teams" : "All my teams";
  const isAllTeamsAvailable = isAdmin || availableTeams.length > 1;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {canUseTeamApp ? (
              <WorkspaceSwitcher
                activeTeam={activeTeam}
                allTeamsLabel={allTeamsLabel}
                isAllTeamsAvailable={isAllTeamsAvailable}
                pathname={pathname}
                teams={availableTeams}
              />
            ) : (
              <SidebarMenuButton
                size="lg"
                render={
                  <Link
                    to="/player"
                    aria-label="Malvern Lacrosse home"
                    title="Malvern Lacrosse"
                    onClick={() => {
                      setOpenMobile(false);
                    }}
                  />
                }
                className="h-9 p-1 hover:bg-transparent active:bg-transparent"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <Landmark aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <strong className="truncate text-xs font-semibold">
                    Malvern Lacrosse
                  </strong>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    Player workspace
                  </span>
                </span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-1">
        {canUseTeamApp ? (
          <>
            {activeTeam === null ? (
              <NavigationGroup
                label={isAdmin ? "Club" : "My teams"}
                items={allTeamsNavigation}
              />
            ) : (
              <TeamNavigationGroup
                fixtureTeamId={fixtureTeamId}
                teamId={activeTeam.id}
              />
            )}
            {isAdmin ? (
              <NavigationGroup label="Admin" items={adminNavigation} />
            ) : null}
          </>
        ) : (
          <NavigationGroup label="Workspace" items={playerNavigation} />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="h-10 p-1 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                    aria-label={`${displayName} account menu`}
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback>{initialsFor(displayName)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="block truncate text-xs font-medium">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs text-sidebar-foreground/60">
                    {roleLabel}
                  </span>
                </span>
                <ChevronsUpDown
                  className="ml-auto group-data-[collapsible=icon]:hidden"
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "top" : "right"}
                align="end"
                sideOffset={8}
                className="w-56"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {me.userEmail}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    render={
                      <Link
                        to="/profile"
                        onClick={() => {
                          setOpenMobile(false);
                        }}
                      />
                    }
                  >
                    <CircleUserRound aria-hidden="true" />
                    User settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isSigningOut}
                    onClick={onSignOut}
                  >
                    <LogOut aria-hidden="true" />
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        {signOutError ? (
          <p
            className="px-1 text-xs text-destructive group-data-[collapsible=icon]:sr-only"
            role="alert"
          >
            {signOutError}
          </p>
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
