import { Link, useMatchRoute, useRouteContext } from '@tanstack/react-router';
import { Settings, Trophy, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

export function MainNav() {
  const routeMatch = useMatchRoute();

  // UGLY
  const isSettings =
    routeMatch({ to: '/$organizationSlug/settings/general' }) ||
    routeMatch({ to: '/$organizationSlug/settings/users' }) ||
    routeMatch({ to: '/$organizationSlug/settings/billing' });

  const isNotTeams =
    routeMatch({ to: '/$organizationSlug/players', fuzzy: true }) ||
    routeMatch({ to: '/$organizationSlug/games', fuzzy: true }) ||
    routeMatch({ to: '/$organizationSlug/feedback', fuzzy: true }) ||
    routeMatch({ to: '/$organizationSlug/plan', fuzzy: true }) ||
    routeMatch({ to: '/$organizationSlug/organization/join' }) ||
    routeMatch({ to: '/$organizationSlug/organization/create' }) ||
    isSettings;

  const isTeams =
    (routeMatch({ to: '/$organizationSlug' }) ||
      routeMatch({ to: '/$organizationSlug/$teamId', fuzzy: true })) &&
    !isNotTeams;

  const { activeOrganization } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={'sr-only'}>Main Nav</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Teams'}>
            <Link
              className={cn(isTeams && 'bg-muted shadow')}
              params={{ organizationSlug: activeOrganization.slug }}
              to={'/$organizationSlug'}
            >
              <Users />
              <span>Teams</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Players'}>
            <Link
              activeProps={{ className: 'bg-muted shadow' }}
              params={{ organizationSlug: activeOrganization.slug }}
              to={'/$organizationSlug/players'}
            >
              <User />
              <span>Players</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Games'}>
            <Link
              activeProps={{ className: 'bg-muted shadow' }}
              params={{ organizationSlug: activeOrganization.slug }}
              to={'/$organizationSlug/games'}
            >
              <Trophy />
              <span>Games</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {/*<SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Playbook'}>
            <Link
              to={'/$organizationSlug/playbook'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <BookOpen />
              <span>Playbook</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Practice'}>
            <Link
              to={'/$organizationSlug/practice'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <Dumbbell />
              <span>Practice</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Film'}>
            <Link
              to={'/$organizationSlug/film'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <Video />
              <span>Film</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Scouting'}>
            <Link
              to={'/$organizationSlug/scouting'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <Search />
              <span>Scouting</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>*/}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Settings'}>
            <Link
              className={cn(isSettings && 'bg-muted shadow')}
              params={{ organizationSlug: activeOrganization.slug }}
              to={'/$organizationSlug/settings/general'}
            >
              <Settings />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
