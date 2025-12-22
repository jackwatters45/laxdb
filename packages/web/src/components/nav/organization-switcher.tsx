import { Link, useRouteContext, useRouter } from '@tanstack/react-router';
import { ChevronsUpDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSwitchOrganization } from '@/mutations/organizations';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';

export function OrganizationSwitcher() {
  const router = useRouter();
  const { organizations, activeOrganization } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });

  const switchOrg = useSwitchOrganization({ router });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  alt={activeOrganization.name ?? 'No Organization'}
                  src={activeOrganization.logo ?? undefined}
                />
                <AvatarFallback className="rounded-lg uppercase">
                  {activeOrganization.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganization?.name || 'No Organization'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="right"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Switch Organization
            </DropdownMenuLabel>
            {organizations.map((org) => {
              const isActive = activeOrganization?.id === org.id;

              return (
                <DropdownMenuItem
                  className="flex w-full items-center justify-between gap-2 p-2"
                  key={org.id}
                  onClick={() => !isActive && switchOrg.mutate(org.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                      <span className="font-medium text-xs">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{org.name}</span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                className="flex items-center gap-2 p-2"
                params={{ organizationSlug: activeOrganization.slug }}
                to="/$organizationSlug/organization/create"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="h-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Create Organization
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                className="flex items-center gap-2 p-2"
                params={{ organizationSlug: activeOrganization.slug }}
                to="/$organizationSlug/organization/join"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="h-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Join Organization
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
