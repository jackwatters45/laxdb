import { Navbar, NavbarItem } from "@laxdb/ui/components/sub-nav";
import { Link } from "@tanstack/react-router";

import { DashboardHeader } from "@/components/sidebar/dashboard-header";

type TeamHeaderProps = {
  organizationSlug: string;
  teamId: string;
  children: React.ReactNode;
};

export function TeamHeader({ organizationSlug, teamId, children }: TeamHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <TeamSubNav organizationSlug={organizationSlug} teamId={teamId} />
    </div>
  );
}

type TeamSubNavProps = {
  organizationSlug: string;
  teamId: string;
};

export function TeamSubNav({ organizationSlug, teamId }: TeamSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem
        render={
          <Link
            activeOptions={{ exact: true }}
            params={{ organizationSlug, teamId }}
            to="/$organizationSlug/$teamId"
          />
        }
      >
        Home
      </NavbarItem>
      <NavbarItem
        render={
          <Link params={{ organizationSlug, teamId }} to="/$organizationSlug/$teamId/players" />
        }
      >
        Players
      </NavbarItem>
    </Navbar>
  );
}
