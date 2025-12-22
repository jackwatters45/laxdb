import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';

type TeamHeaderProps = {
  organizationSlug: string;
  teamId: string;
  children: React.ReactNode;
};

export function TeamHeader({
  organizationSlug,
  teamId,
  children,
}: TeamHeaderProps) {
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
      <NavbarItem asChild>
        <Link
          activeOptions={{ exact: true }}
          params={{ organizationSlug, teamId }}
          to="/$organizationSlug/$teamId"
        >
          Home
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          params={{ organizationSlug, teamId }}
          to="/$organizationSlug/$teamId/players"
        >
          Players
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
