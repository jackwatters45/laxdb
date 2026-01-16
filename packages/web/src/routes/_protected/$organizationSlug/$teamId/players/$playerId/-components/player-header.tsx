import { Navbar, NavbarItem } from "@laxdb/ui/components/sub-nav";
import { Link } from "@tanstack/react-router";

import { DashboardHeader } from "@/components/sidebar/dashboard-header";

type PlayerHeaderProps = {
  organizationSlug: string;
  teamId: string;
  playerId: string;
  children: React.ReactNode;
};

export function PlayerHeader({ organizationSlug, teamId, playerId, children }: PlayerHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <PlayerSubNav organizationSlug={organizationSlug} playerId={playerId} teamId={teamId} />
    </div>
  );
}

type PlayerSubNavProps = {
  organizationSlug: string;
  teamId: string;
  playerId: string;
};

export function PlayerSubNav({ organizationSlug, teamId, playerId }: PlayerSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem
        render={
          <Link
            activeOptions={{ exact: true }}
            params={{ organizationSlug, teamId, playerId }}
            to="/$organizationSlug/$teamId/players/$playerId"
          />
        }
      >
        Info
      </NavbarItem>
      <NavbarItem
        render={
          <Link
            params={{ organizationSlug, teamId, playerId }}
            to="/$organizationSlug/$teamId/players/$playerId/contact-info"
          />
        }
      >
        Contact Info
      </NavbarItem>
      <NavbarItem
        render={
          <Link
            params={{ organizationSlug, teamId, playerId }}
            to="/$organizationSlug/$teamId/players/$playerId/edit"
          />
        }
      >
        Edit
      </NavbarItem>
    </Navbar>
  );
}
