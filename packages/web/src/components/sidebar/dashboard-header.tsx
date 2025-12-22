import { Link, useRouteContext } from '@tanstack/react-router';
import type React from 'react';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NavUserHeader } from '../nav/nav-user';

export function DashboardHeader({ children }: { children: React.ReactNode }) {
  const { activeOrganization } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background pr-2 pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Sidebar (⌘+B)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator className="mr-2 h-4" orientation="vertical" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">{children}</BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2">
        <Link
          params={{ organizationSlug: activeOrganization.slug }}
          to="/$organizationSlug/plan"
        >
          <Button size={'sm'} variant="outline">
            Plan
          </Button>
        </Link>
        <Link
          params={{ organizationSlug: activeOrganization.slug }}
          to="/$organizationSlug/feedback"
        >
          <Button size={'sm'} variant="outline">
            Feedback
          </Button>
        </Link>
        <NavUserHeader />
      </div>
    </header>
  );
}

type DashboardHeaderProps = {
  breadcrumbItems: {
    label: string;
    href: string | null;
  }[];
};

export function DashboardHeaderOld(props: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 right-0 left-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background pr-2 pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Sidebar (⌘+B)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator className="mr-2 h-4" orientation="vertical" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            {props.breadcrumbItems.map((item, i) => (
              <Fragment key={item.label}>
                <BreadcrumbItem
                  className={
                    i === props.breadcrumbItems.length - 1
                      ? 'min-w-0 flex-1'
                      : ''
                  }
                >
                  {item.href ? (
                    <BreadcrumbLink
                      className={`truncate ${i === props.breadcrumbItems.length - 1 ? 'max-w-full' : ''}`}
                      href={item.href}
                      title={item.label}
                    >
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage
                      className={`truncate ${i === props.breadcrumbItems.length - 1 ? 'max-w-full' : ''}`}
                      title={item.label}
                    >
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {i !== props.breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/*<SearchCommand />*/}
    </header>
  );
}
