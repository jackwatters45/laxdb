import type * as React from "react";
import { NavUserSidebar } from "@/components/nav/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@laxdb/ui/components/ui/sidebar";
import { OrganizationSwitcher } from "@/components/nav/organization-switcher";
import { SearchCommand } from "@/components/nav/search-command";
import { MainNav } from "./main-nav";

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
