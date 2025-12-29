import { Link } from "@tanstack/react-router";
import { Navbar, NavbarItem } from "@laxdb/ui/components/sub-nav";

type SettingsHeaderProps = {
  organizationSlug: string;
};

export function SettingsSubNav({ organizationSlug }: SettingsHeaderProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem
        render={
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/settings/general"
          />
        }
      >
        General
      </NavbarItem>
      <NavbarItem
        render={
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/settings/users"
          />
        }
      >
        Users
      </NavbarItem>
      <NavbarItem
        render={
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/settings/billing"
          />
        }
      >
        Billing
      </NavbarItem>
    </Navbar>
  );
}
