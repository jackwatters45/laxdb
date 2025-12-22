import { RiAddLine, RiMore2Fill } from '@remixicon/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { PageBody } from '@/components/layout/page-content';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SettingsHeader } from '../-components/settings-header';
import { invitedUsers, roles, users } from '../-data';
import { ModalAddUser } from './-ModalAddUser';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/settings/users/'
)({
  component: Users,
});

function Users() {
  return (
    <>
      <Header />
      <PageBody>
        <div className="container py-8">
          <section aria-labelledby="existing-users">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3
                  className="scroll-mt-10 font-semibold text-foreground"
                  id="existing-users"
                >
                  Users
                </h3>
                <p className="text-muted-foreground text-sm leading-6">
                  Workspace administrators can add, manage, and remove users.
                </p>
              </div>
              <ModalAddUser>
                <Button className="mt-4 w-full gap-2 sm:mt-0 sm:w-fit">
                  <RiAddLine
                    aria-hidden="true"
                    className="-ml-1 size-4 shrink-0"
                  />
                  Add user
                </Button>
              </ModalAddUser>
            </div>
            <ul className="mt-6 divide-y divide-border">
              {users.map((user) => (
                <li
                  className="flex items-center justify-between gap-x-6 py-2.5"
                  key={user.name}
                >
                  <div className="flex items-center gap-x-4 truncate">
                    <span
                      aria-hidden="true"
                      className="hidden size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground text-xs sm:flex"
                    >
                      {user.initials}
                    </span>
                    <div className="truncate">
                      <p className="truncate font-medium text-foreground text-sm">
                        {user.name}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Select
                                defaultValue={user.role}
                                disabled={user.role === 'admin'}
                              >
                                <SelectTrigger className="h-8 w-32">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                  {roles.map((role) => (
                                    <SelectItem
                                      disabled={role.value === 'admin'}
                                      key={role.value}
                                      value={role.value}
                                    >
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            className="max-w-44 text-xs"
                            sideOffset={5}
                          >
                            A workspace must have at least one admin
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Select
                        defaultValue={user.role}
                        disabled={user.role === 'admin'}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {roles.map((role) => (
                            <SelectItem
                              disabled={role.value === 'admin'}
                              key={role.value}
                              value={role.value}
                            >
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="group size-8 hover:border hover:border-border hover:bg-muted data-[state=open]:border-border data-[state=open]:bg-muted"
                          variant="ghost"
                        >
                          <RiMore2Fill
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem disabled={user.role === 'admin'}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-500"
                          disabled={user.role === 'admin'}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="pending-invitations" className="mt-12">
            <h2
              className="scroll-mt-10 font-semibold text-foreground"
              id="pending-invitations"
            >
              Pending invitations
            </h2>
            <ul className="mt-6 divide-y divide-border">
              {invitedUsers.map((user) => (
                <li
                  className="flex items-center justify-between gap-x-6 py-2.5"
                  key={user.initials}
                >
                  <div className="flex items-center gap-x-4">
                    <span
                      aria-hidden="true"
                      className="hidden size-9 shrink-0 items-center justify-center rounded-full border border-border border-dashed bg-background text-muted-foreground text-xs sm:flex"
                    >
                      {user.initials}
                    </span>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {user.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Expires in {user.expires} days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue={user.role}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        {roles.map((role) => (
                          <SelectItem
                            disabled={role.value === 'admin'}
                            key={role.value}
                            value={role.value}
                          >
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="group size-8 hover:border hover:border-border hover:bg-muted data-[state=open]:border-border data-[state=open]:bg-muted"
                          variant="ghost"
                        >
                          <RiMore2Fill
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-500"
                          disabled={user.role === 'admin'}
                        >
                          Revoke invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <SettingsHeader organizationSlug={organizationSlug}>
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Settings">
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/settings/general"
          >
            Settings
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Users">
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/settings/users"
          >
            Users
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </SettingsHeader>
  );
}
