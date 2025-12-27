import { Link } from "@tanstack/react-router";
import type { Team } from "better-auth/plugins";
import {
  BreadcrumbDropdown,
  BreadcrumbDropdownContent,
  BreadcrumbDropdownItem,
  BreadcrumbDropdownLabel,
  BreadcrumbDropdownSeparator,
  BreadcrumbDropdownTrigger,
  BreadcrumbItem,
  BreadcrumbLink,
} from "../../../../ui/src/components/ui/breadcrumb";

type TeamBasic = Pick<Team, "id" | "name">;

type TeamSwitcherProps = {
  activeTeam: Team;
  teams: TeamBasic[];
  organizationSlug: string;
  children: (props: { team: TeamBasic }) => React.ReactNode;
};

export function TeamBreadcrumbSwitcher({
  activeTeam,
  teams,
  organizationSlug,
  children,
}: TeamSwitcherProps) {
  return (
    <BreadcrumbItem>
      <BreadcrumbDropdown>
        <BreadcrumbLink
          render={
            <Link
              params={{ organizationSlug, teamId: activeTeam.id }}
              to="/$organizationSlug/$teamId"
            />
          }
        >
          {activeTeam.name}
        </BreadcrumbLink>
        <BreadcrumbDropdownTrigger />
        <BreadcrumbDropdownContent>
          <BreadcrumbDropdownLabel>Switch Team</BreadcrumbDropdownLabel>
          <BreadcrumbDropdownSeparator />
          {teams.map((team) => (
            <BreadcrumbDropdownItem asChild key={team.id}>
              {children({ team })}
            </BreadcrumbDropdownItem>
          ))}
        </BreadcrumbDropdownContent>
      </BreadcrumbDropdown>
    </BreadcrumbItem>
  );
}
