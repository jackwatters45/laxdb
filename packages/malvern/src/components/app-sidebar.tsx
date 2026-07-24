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
import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronsUpDown,
  CircleUserRound,
  FileText,
  Images,
  Landmark,
  LogOut,
  Settings,
  Shield,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const clubNavigation = [
  { to: "/teams", label: "Teams", icon: Shield },
  { to: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/photos", label: "Photos", icon: Images },
  { to: "/roster", label: "Roster", icon: UsersRound },
] satisfies ReadonlyArray<NavigationItem>;

const adminNavigation = [
  { to: "/admin", label: "Admin", icon: Settings },
] satisfies ReadonlyArray<NavigationItem>;

const playerNavigation = [
  { to: "/player", label: "Player", icon: UserRound },
] satisfies ReadonlyArray<NavigationItem>;

type NavigationItem = {
  readonly to:
    | "/admin"
    | "/fixtures"
    | "/photos"
    | "/player"
    | "/reports"
    | "/roster"
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
};

type NavigationGroupProps = {
  readonly label: string;
  readonly items: ReadonlyArray<NavigationItem>;
};

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- NavigationItem is readonly; Lucide's component type is not.
function NavigationGroup(props: Readonly<NavigationGroupProps>) {
  const { label, items } = props;
  const { pathname } = useLocation();
  const { setOpenMobile, state } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="h-6">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- NavigationItem is readonly; Lucide's component type is not. */}
          {items.map((item: NavigationItem) => {
            const { to, label: itemLabel, icon: Icon } = item;
            const isActive =
              pathname === to ||
              (to === "/fixtures" && pathname.startsWith("/fixtures/")) ||
              (to === "/teams" && pathname.startsWith("/teams/"));

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

export function AppSidebar({
  canUseTeamApp,
  isAdmin,
  isSigningOut,
  me,
  onSignOut,
  roleLabel,
  signOutError,
}: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const displayName = displayNameFor(me);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link
                  to={canUseTeamApp ? "/teams" : "/player"}
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
                  Club operations
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-1">
        {canUseTeamApp ? (
          <>
            <NavigationGroup label="Club" items={clubNavigation} />
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
