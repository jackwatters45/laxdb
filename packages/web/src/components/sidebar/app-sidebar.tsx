import type * as React from 'react';
import { NavUserSidebar } from '@/components/nav/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { OrganizationSwitcher } from '../nav/organization-switcher';
import { SearchCommand } from '../nav/search-command';
import { MainNav } from './main-nav';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
        <SearchCommand />
      </SidebarHeader>
      <SidebarContent>
        <MainNav />
      </SidebarContent>
      <SidebarFooter>
        <NavUserSidebar />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
