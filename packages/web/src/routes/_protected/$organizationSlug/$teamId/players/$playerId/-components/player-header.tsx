import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';

type PlayerHeaderProps = {
  organizationSlug: string;
  teamId: string;
  playerId: string;
  children: React.ReactNode;
};

export function PlayerHeader({
  organizationSlug,
  teamId,
  playerId,
  children,
}: PlayerHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <PlayerSubNav
        organizationSlug={organizationSlug}
        playerId={playerId}
        teamId={teamId}
      />
    </div>
  );
}

type PlayerSubNavProps = {
  organizationSlug: string;
  teamId: string;
  playerId: string;
};

export function PlayerSubNav({
  organizationSlug,
  teamId,
  playerId,
}: PlayerSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem asChild>
        <Link
          activeOptions={{ exact: true }}
          params={{ organizationSlug, teamId, playerId }}
          to="/$organizationSlug/$teamId/players/$playerId"
        >
          Info
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          params={{ organizationSlug, teamId, playerId }}
          to="/$organizationSlug/$teamId/players/$playerId/contact-info"
        >
          Contact Info
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          params={{ organizationSlug, teamId, playerId }}
          to="/$organizationSlug/$teamId/players/$playerId/edit"
        >
          Edit
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
