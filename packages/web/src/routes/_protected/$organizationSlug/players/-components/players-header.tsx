import { Navbar, NavbarItem } from "@laxdb/ui/components/sub-nav";
import { Link } from "@tanstack/react-router";

import { DashboardHeader } from "@/components/sidebar/dashboard-header";

type PlayersHeaderProps = {
  organizationSlug: string;
  children: React.ReactNode;
};

export function PlayersHeader({
  organizationSlug,
  children,
}: PlayersHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <PlayersSubNav organizationSlug={organizationSlug} />
    </div>
  );
}

type PlayersSubNavProps = {
  organizationSlug: string;
};

export function PlayersSubNav({ organizationSlug }: PlayersSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem
        render={
          <Link
            activeOptions={{ exact: true }}
            params={{ organizationSlug }}
            to="/$organizationSlug/players"
          />
        }
      >
        Table
      </NavbarItem>
      <NavbarItem
        render={
          <Link
            activeOptions={{ exact: true }}
            params={{ organizationSlug }}
            to="/$organizationSlug/players/dashboard"
          />
        }
      >
        Dasboard
      </NavbarItem>
    </Navbar>
  );
}
