import { RiExternalLinkLine } from '@remixicon/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { PageBody } from '@/components/layout/page-content';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SettingsHeader } from '../-components/settings-header';
import { roles } from '../-data';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/settings/general/'
)({
  component: General,
});

function General() {
  return (
    <>
      <Header />
      <PageBody>
        <div className="container space-y-10 py-8">
          <section aria-labelledby="personal-information">
            <form>
              <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
                <div>
                  <h2
                    className="scroll-mt-10 font-semibold text-foreground"
                    id="personal-information"
                  >
                    Personal information
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    Manage your personal information and role.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                    <div className="col-span-full sm:col-span-3">
                      <Label className="font-medium" htmlFor="first-name">
                        First name
                      </Label>
                      <Input
                        autoComplete="given-name"
                        className="mt-2"
                        id="first-name"
                        name="first-name"
                        placeholder="Emma"
                        type="text"
                      />
                    </div>
                    <div className="col-span-full sm:col-span-3">
                      <Label className="font-medium" htmlFor="last-name">
                        Last name
                      </Label>
                      <Input
                        autoComplete="family-name"
                        className="mt-2"
                        id="last-name"
                        name="last-name"
                        placeholder="Stone"
                        type="text"
                      />
                    </div>
                    <div className="col-span-full">
                      <Label className="font-medium" htmlFor="email">
                        Email
                      </Label>
                      <Input
                        autoComplete="email"
                        className="mt-2"
                        id="email"
                        name="email"
                        placeholder="emma@acme.com"
                        type="email"
                      />
                    </div>
                    <div className="col-span-full sm:col-span-3">
                      <Label className="font-medium" htmlFor="year">
                        Birth year
                      </Label>
                      <Input
                        autoComplete="off"
                        className="mt-2"
                        id="birthyear"
                        max={new Date().getFullYear()}
                        min="1900"
                        name="year"
                        placeholder="1994"
                        step="1"
                        type="number"
                      />
                    </div>
                    <div className="col-span-full sm:col-span-3">
                      <Label className="font-medium" htmlFor="email">
                        Role
                      </Label>
                      <Select defaultValue="member">
                        <SelectTrigger
                          className="mt-2"
                          disabled
                          id="role"
                          name="role"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-muted-foreground text-xs">
                        Roles can only be changed by system admin.
                      </p>
                    </div>
                    <div className="col-span-full mt-6 flex justify-end">
                      <Button type="submit">Save settings</Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </section>
          <Separator />
          <section aria-labelledby="notification-settings">
            <form>
              <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
                <div>
                  <h2
                    className="scroll-mt-10 font-semibold text-foreground"
                    id="notification-settings"
                  >
                    Notification settings
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    Configure the types of notifications you want to receive.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <fieldset>
                    <legend className="font-medium text-foreground text-sm">
                      Team
                    </legend>
                    <p className="mt-1 text-muted-foreground text-sm leading-6">
                      Configure the types of team alerts you want to receive.
                    </p>
                    <ul className="mt-4 divide-y divide-border">
                      <li className="flex items-center gap-x-3 py-3">
                        <Checkbox
                          defaultChecked
                          id="team-requests"
                          name="team-requests"
                        />
                        <Label htmlFor="team-requests">
                          Team join requests
                        </Label>
                      </li>
                      <li className="flex items-center gap-x-3 py-3">
                        <Checkbox id="team-activity-digest" />
                        <Label htmlFor="team-activity-digest">
                          Weekly team activity digest
                        </Label>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset className="mt-6">
                    <legend className="font-medium text-foreground text-sm">
                      Usage
                    </legend>
                    <p className="mt-1 text-muted-foreground text-sm leading-6">
                      Configure the types of usage alerts you want to receive.
                    </p>
                    <ul className="mt-4 divide-y divide-border">
                      <li className="flex items-center gap-x-3 py-3">
                        <Checkbox id="api-requests" name="api-requests" />
                        <Label htmlFor="api-requests">API incidents</Label>
                      </li>
                      <li className="flex items-center gap-x-3 py-3">
                        <Checkbox
                          id="workspace-execution"
                          name="workspace-execution"
                        />
                        <Label htmlFor="workspace-execution">
                          Platform incidents
                        </Label>
                      </li>
                      <li className="flex items-center gap-x-3 py-3">
                        <Checkbox
                          defaultChecked
                          id="query-caching"
                          name="query-caching"
                        />
                        <Label htmlFor="query-caching">
                          Payment transactions
                        </Label>
                      </li>
                      <li className="flex items-center gap-x-3 py-3">
                        <Checkbox defaultChecked id="storage" name="storage" />
                        <Label htmlFor="storage">User behavior</Label>
                      </li>
                    </ul>
                  </fieldset>
                  <div className="col-span-full mt-6 flex justify-end">
                    <Button type="submit">Save settings</Button>
                  </div>
                </div>
              </div>
            </form>
          </section>
          <Separator />
          <section aria-labelledby="danger-zone">
            <form>
              <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
                <div>
                  <h2
                    className="scroll-mt-10 font-semibold text-foreground"
                    id="danger-zone"
                  >
                    Danger zone
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    Manage general workspace. Contact system admin for more
                    information.{' '}
                    <a
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline hover:underline-offset-4 dark:text-indigo-400"
                      href="#"
                    >
                      Learn more
                      <RiExternalLinkLine
                        aria-hidden="true"
                        className="size-4 shrink-0"
                      />
                    </a>
                  </p>
                </div>
                <div className="space-y-6 md:col-span-2">
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-10">
                      <div>
                        <h4 className="font-medium text-foreground text-sm">
                          Leave workspace
                        </h4>
                        <p className="mt-2 text-muted-foreground text-sm leading-6">
                          Revoke your access to this team. Other people you have
                          added to the workspace will remain.
                        </p>
                      </div>
                      <Button
                        className="text-red-600 dark:text-red-500"
                        variant="secondary"
                      >
                        Leave
                      </Button>
                    </div>
                  </Card>
                  <Card className="overflow-hidden p-0">
                    <div className="flex items-start justify-between gap-10 p-4">
                      <div>
                        <h4 className="font-medium text-muted-foreground text-sm">
                          Delete workspace
                        </h4>
                        <p className="mt-2 text-muted-foreground text-sm leading-6">
                          Revoke your access to this team. Other people you have
                          added to the workspace will remain.
                        </p>
                      </div>
                      <Button
                        className="whitespace-nowrap text-red-600 disabled:text-red-300 disabled:opacity-50 dark:text-red-500 disabled:dark:text-red-700"
                        disabled
                        variant="secondary"
                      >
                        Delete workspace
                      </Button>
                    </div>
                    <div className="border-border border-t bg-muted p-4">
                      <p className="text-muted-foreground text-sm">
                        You cannot delete the workspace because you are not the
                        system admin.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </form>
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
        <BreadcrumbLink asChild title="General">
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/settings/general"
          >
            General
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </SettingsHeader>
  );
}
