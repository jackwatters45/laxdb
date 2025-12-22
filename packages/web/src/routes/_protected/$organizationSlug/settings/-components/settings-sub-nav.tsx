import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';

type SettingsHeaderProps = {
  organizationSlug: string;
};

export function SettingsSubNav({ organizationSlug }: SettingsHeaderProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem asChild>
        <Link
          params={{ organizationSlug }}
          to="/$organizationSlug/settings/general"
        >
          General
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          params={{ organizationSlug }}
          to="/$organizationSlug/settings/users"
        >
          Users
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          params={{ organizationSlug }}
          to="/$organizationSlug/settings/billing"
        >
          Billing
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
