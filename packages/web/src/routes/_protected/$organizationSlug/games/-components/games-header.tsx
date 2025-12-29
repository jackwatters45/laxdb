import { Link } from "@tanstack/react-router";
import { Navbar, NavbarItem } from "@laxdb/ui/components/sub-nav";
import { DashboardHeader } from "@/components/sidebar/dashboard-header";

type GamesHeaderProps = {
  organizationSlug: string;
  children: React.ReactNode;
};

export function GamesHeader({ organizationSlug, children }: GamesHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <GamesSubNav organizationSlug={organizationSlug} />
    </div>
  );
}

type GamesSubNavProps = {
  organizationSlug: string;
};

export function GamesSubNav({ organizationSlug }: GamesSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem
        render={
          <Link
            activeOptions={{ exact: true }}
            params={{ organizationSlug }}
            to="/$organizationSlug/games"
          />
        }
      >
        Info
      </NavbarItem>
      <NavbarItem
        render={
          <Link
            activeOptions={{ exact: true }}
            params={{ organizationSlug }}
            to="/$organizationSlug/games/old"
          />
        }
      >
        Old
      </NavbarItem>
    </Navbar>
  );
}
