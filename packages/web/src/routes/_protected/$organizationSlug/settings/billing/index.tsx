import { RiArrowRightUpLine } from '@remixicon/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import React from 'react';
import { PageBody } from '@/components/layout/page-content';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SettingsHeader } from '../-components/settings-header';

const data: {
  name: string;
  description: string;
  value: string;
  capacity?: string;
  percentageValue?: number;
}[] = [
  {
    name: 'Starter plan',
    description: 'Discounted plan for start-ups and growing companies',
    value: '$90',
  },
  {
    name: 'Storage',
    description: 'Used 10.1 GB',
    value: '$40',
    capacity: '100 GB included',
    percentageValue: 10.1,
  },
  {
    name: 'Bandwith',
    description: 'Used 2.9 GB',
    value: '$10',
    capacity: '5 GB included',
    percentageValue: 58,
  },
  {
    name: 'Users',
    description: 'Used 9',
    value: '$20',
    capacity: '50 users included',
    percentageValue: 18,
  },
  {
    name: 'Query super caching (EU-Central 1)',
    description: '4 GB query cache, $120/mo',
    value: '$120.00',
  },
];

export const Route = createFileRoute(
  '/_protected/$organizationSlug/settings/billing/'
)({
  component: Billing,
});

function Billing() {
  const [isSpendMgmtEnabled, setIsSpendMgmtEnabled] = React.useState(true);
  return (
    <>
      <Header />
      <PageBody>
        <div className="container space-y-10 py-8">
          <div className="rounded-lg bg-muted p-6 ring-1 ring-border ring-inset dark:bg-muted/50 dark:ring-border">
            <h4 className="font-semibold text-foreground text-sm">
              This workspace is currently on free plan
            </h4>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm leading-6">
              Boost your analytics and unlock advanced features with our premium
              plans.{' '}
              <a
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-500"
                href="#"
              >
                Compare plans
                <RiArrowRightUpLine
                  aria-hidden="true"
                  className="size-4 shrink-0"
                />
              </a>
            </p>
          </div>
          <div className="mt-6 space-y-10">
            <section aria-labelledby="billing-overview">
              <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
                <div>
                  <h2
                    className="scroll-mt-10 font-semibold text-foreground"
                    id="billing-overview"
                  >
                    Billing
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    Overview of current billing cycle based on fixed and
                    on-demand charges.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <ul className="w-full divide-y divide-border border-border border-b">
                    {data.map((item) => (
                      <li className="px-2 py-4 text-sm md:p-4" key={item.name}>
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="font-medium text-muted-foreground">
                              {item.value}
                            </p>
                          </div>
                          <div className="w-full md:w-2/3">
                            {item.percentageValue && (
                              <Progress
                                className="mt-2 h-1.5"
                                value={item.percentageValue}
                              />
                            )}
                            <p className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
                              <span>{item.description}</span>
                              <span>{item.capacity}</span>
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="px-2 py-4 md:p-4">
                    <p className="flex items-center justify-between font-medium text-foreground text-sm">
                      <span>Total for May 24</span>
                      <span className="font-semibold">$280</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>
            <Separator />
            <section aria-labelledby="cost-spend-control">
              <form>
                <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
                  <div>
                    <h2
                      className="scroll-mt-10 font-semibold text-foreground"
                      id="cost-spend-control"
                    >
                      Cost spend control
                    </h2>
                    <p className="mt-1 text-muted-foreground text-sm leading-6">
                      Set hard caps for on-demand charges.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-16 w-16 items-center justify-center">
                          <Progress
                            className="h-2 w-12 rotate-90"
                            value={isSpendMgmtEnabled ? 62.2 : 0}
                          />
                        </div>
                        <div>
                          {isSpendMgmtEnabled ? (
                            <>
                              <p className="font-medium text-foreground text-sm">
                                &#36;280 / 350 (62.2&#37;)
                              </p>
                              <Label
                                className="text-muted-foreground"
                                htmlFor="spend-mgmt"
                              >
                                Spend management enabled
                              </Label>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-foreground text-sm">
                                &#36;0 / 0 (0&#37;)
                              </p>
                              <Label
                                className="text-muted-foreground"
                                htmlFor="spend-mgmt"
                              >
                                Spend management disabled
                              </Label>
                            </>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={isSpendMgmtEnabled}
                        id="spend-mgmt"
                        name="spend-mgmt"
                        onCheckedChange={() => {
                          setIsSpendMgmtEnabled(!isSpendMgmtEnabled);
                        }}
                      />
                    </div>
                    <div
                      className={cn(
                        'transform-gpu transition-all ease-smooth-bounce will-change-transform',
                        isSpendMgmtEnabled ? 'h-52 md:h-32' : 'h-0'
                      )}
                      style={{
                        transitionDuration: '300ms',
                        animationFillMode: 'backwards',
                      }}
                    >
                      <div
                        className={cn(
                          'animate-slideDownAndFade transition',
                          isSpendMgmtEnabled ? '' : 'hidden'
                        )}
                        style={{
                          animationDelay: '100ms',
                          animationDuration: '300ms',
                          transitionDuration: '300ms',
                          animationFillMode: 'backwards',
                        }}
                      >
                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="md:col-span-1">
                            <Label className="font-medium">
                              Set amount ($)
                            </Label>
                            <Input
                              className="mt-2"
                              defaultValue={350}
                              id="hard-cap"
                              name="hard-cap"
                              type="number"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="font-medium">
                              Provide email for notifications
                            </Label>
                            <Input
                              className="mt-2"
                              id="email"
                              name="email"
                              placeholder="admin@company.com"
                              type="email"
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <Button type="submit">Update</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </section>
            <Separator />
            <section aria-labelledby="add-ons">
              <form>
                <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
                  <div>
                    <h2
                      className="scroll-mt-10 font-semibold text-foreground"
                      id="add-ons"
                    >
                      Add-Ons
                    </h2>
                    <p className="mt-1 text-muted-foreground text-sm leading-6">
                      Additional services to boost your services.
                    </p>
                  </div>
                  <div className="space-y-6 md:col-span-2">
                    <Card className="overflow-hidden p-0">
                      <div className="px-4 pt-4 pb-6">
                        <span className="text-muted-foreground text-sm">
                          $25/month
                        </span>
                        <h4 className="mt-4 font-semibold text-foreground text-sm">
                          Advanced bot protection
                        </h4>
                        <p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
                          Safeguard your assets with our cutting-edge bot
                          protection. Our AI solution identifies and mitigates
                          automated traffic to protect your workspace from bad
                          bots.
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-border border-t bg-muted p-4">
                        <div className="flex items-center gap-3">
                          <Switch id="bot-protection" name="bot-protection" />
                          <Label htmlFor="bot-protection">Activate</Label>
                        </div>
                        <a
                          className="inline-flex items-center gap-1 text-indigo-600 text-sm dark:text-indigo-500"
                          href="#"
                        >
                          Learn more
                          <RiArrowRightUpLine
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                        </a>
                      </div>
                    </Card>
                    <Card className="overflow-hidden p-0">
                      <div className="px-4 pt-4 pb-6">
                        <span className="text-muted-foreground text-sm">
                          $50/month
                        </span>
                        <h4 className="mt-4 font-semibold text-foreground text-sm">
                          Workspace insights
                        </h4>
                        <p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
                          Real-time analysis of your workspace&#39;s usage,
                          enabling you to make well-informed decisions for
                          optimization.
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-border border-t bg-muted p-4">
                        <div className="flex items-center gap-3">
                          <Switch id="insights" name="insights" />
                          <Label htmlFor="insights">Activate</Label>
                        </div>
                        <a
                          className="inline-flex items-center gap-1 text-indigo-600 text-sm dark:text-indigo-500"
                          href="#"
                        >
                          Learn more
                          <RiArrowRightUpLine
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                        </a>
                      </div>
                    </Card>
                  </div>
                </div>
              </form>
            </section>
          </div>
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
        <BreadcrumbLink asChild title="Billing">
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/settings/billing"
          >
            Billing
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </SettingsHeader>
  );
}
