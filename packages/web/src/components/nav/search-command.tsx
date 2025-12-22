import {
  Link,
  useNavigate,
  useRouteContext,
  useRouter,
} from '@tanstack/react-router';
import {
  BookOpen,
  Building2,
  Dumbbell,
  FileText,
  Home,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Trophy,
  User,
  Users,
  Video,
} from 'lucide-react';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useSwitchOrganization } from '@/mutations/organizations';

export function SearchCommand() {
  const { organizations, activeOrganization } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });

  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  const switchOrg = useSwitchOrganization({ setOpen, router });

  useHotkeys('meta+k', () => setOpen(true));

  const navigationItems = activeOrganization
    ? [
        {
          label: 'Teams',
          href: '/$organizationSlug',
          icon: Users,
          shortcut: '⌘⇧T',
        },
        {
          label: 'Players',
          href: '/$organizationSlug/players',
          icon: User,
          shortcut: '⌘⇧P',
        },
        {
          label: 'Games',
          href: '/$organizationSlug/games',
          icon: Trophy,
          shortcut: '⌘⇧G',
        },
        {
          label: 'Playbook',
          href: '/$organizationSlug/playbook',
          icon: BookOpen,
          shortcut: '⌘⇧B',
        },
        {
          label: 'Practice',
          href: '/$organizationSlug/practice',
          icon: Dumbbell,
          shortcut: '⌘⇧R',
        },
        {
          label: 'Film',
          href: '/$organizationSlug/film',
          icon: Video,
          shortcut: '⌘⇧V',
        },
        {
          label: 'Scouting',
          href: '/$organizationSlug/scouting',
          icon: Search,
          shortcut: '⌘⇧S',
        },
      ]
    : [
        {
          label: 'Home',
          href: '/',
          icon: Home,
          shortcut: '⌘⇧T',
        },
      ];

  const settingsItems = activeOrganization
    ? [
        {
          label: 'Organization Settings',
          href: '/$organizationSlug/settings',
          icon: Settings,
          shortcut: '⌘⇧,',
        },
      ]
    : [];

  const generalItems = [
    {
      label: 'Plan',
      href: '/$organizationSlug/plan',
      icon: FileText,
      shortcut: '⌘⇧L',
    },
    {
      label: 'Feedback',
      href: '/$organizationSlug/feedback',
      icon: MessageSquare,
      shortcut: '⌘⇧E',
    },
  ];

  // Set up hotkeys for navigation
  useHotkeys('meta+shift+t', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug',
        params: { organizationSlug: activeOrganization.slug },
      });
    } else {
      navigate({ to: '/' });
    }
  });

  useHotkeys('meta+shift+p', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug/players',
        params: { organizationSlug: activeOrganization.slug },
      });
    }
  });

  useHotkeys('meta+shift+g', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug/games',
        params: { organizationSlug: activeOrganization.slug },
      });
    }
  });

  useHotkeys('meta+shift+b', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug/playbook',
        params: { organizationSlug: activeOrganization.slug },
      });
    }
  });

  useHotkeys('meta+shift+r', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug/practice',
        params: { organizationSlug: activeOrganization.slug },
      });
    }
  });

  useHotkeys('meta+shift+v', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug/film',
        params: { organizationSlug: activeOrganization.slug },
      });
    }
  });

  useHotkeys('meta+shift+s', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug/scouting',
        params: { organizationSlug: activeOrganization.slug },
      });
    }
  });

  useHotkeys('meta+shift+comma', () => {
    if (activeOrganization) {
      navigate({
        to: '/$organizationSlug/settings/general',
        params: { organizationSlug: activeOrganization.slug },
      });
    }
  });

  useHotkeys('meta+shift+l', () => {
    navigate({
      to: '/$organizationSlug/plan',
      params: { organizationSlug: activeOrganization.slug },
    });
  });

  useHotkeys('meta+shift+e', () => {
    navigate({
      to: '/$organizationSlug/feedback',
      params: { organizationSlug: activeOrganization.slug },
    });
  });

  // Organization switching hotkeys (⌘⇧1-9 for first 9 organizations)
  useHotkeys('meta+shift+1', () => {
    const org = organizations[0];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+2', () => {
    const org = organizations[1];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+3', () => {
    const org = organizations[2];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+4', () => {
    const org = organizations[3];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+5', () => {
    const org = organizations[4];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+6', () => {
    const org = organizations[5];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+7', () => {
    const org = organizations[6];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+8', () => {
    const org = organizations[7];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  useHotkeys('meta+shift+9', () => {
    const org = organizations[8];
    if (org && org.id !== activeOrganization?.id) {
      switchOrg.mutate(org.id);
    }
  });

  return (
    <>
      <Button
        className="h-8 w-full cursor-text justify-between pr-1 pl-2 font-normal text-foreground focus:border-ring focus:ring-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        variant="outline"
      >
        <div className="flex items-center gap-2 text-sm">
          <Search className="size-3 transform text-muted-foreground" />
          <span className="group-data-[collapsible=icon]:hidden">Search</span>
        </div>
        <kbd className="rounded-md border bg-muted px-1 py-0.5 font-semibold text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {organizations.length > 0 && (
            <CommandGroup heading="Organizations">
              {organizations.map((org, index) => {
                const isActive = activeOrganization?.id === org.id;
                const shortcut = index < 9 ? `⌘⇧${index + 1}` : undefined;

                return (
                  <CommandItem
                    key={org.id}
                    onSelect={() => {
                      if (!isActive) {
                        switchOrg.mutate(org.id);
                      }
                    }}
                  >
                    <div className="flex flex-1 space-x-2">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>{org.name}</span>
                    </div>
                    {isActive && (
                      <div className="mr-2 ml-auto h-2 w-2 rounded-full bg-green-500" />
                    )}
                    {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
                  </CommandItem>
                );
              })}
              <CommandItem asChild onSelect={() => setOpen(false)}>
                <Link
                  params={{ organizationSlug: activeOrganization.slug }}
                  to="/$organizationSlug/organization/create"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create Organization</span>
                </Link>
              </CommandItem>
              <CommandItem asChild onSelect={() => setOpen(false)}>
                <Link
                  params={{ organizationSlug: activeOrganization.slug }}
                  to="/$organizationSlug/organization/join"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Join Organization</span>
                </Link>
              </CommandItem>
            </CommandGroup>
          )}

          {organizations.length > 0 && <CommandSeparator />}

          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                asChild
                key={item.href}
                onSelect={() => setOpen(false)}
              >
                <Link to={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  )}
                </Link>
              </CommandItem>
            ))}
          </CommandGroup>

          {generalItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="General">
                {generalItems.map((item) => (
                  <CommandItem
                    asChild
                    key={item.href}
                    onSelect={() => setOpen(false)}
                  >
                    <Link to={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      )}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {settingsItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                {settingsItems.map((item) => (
                  <CommandItem
                    asChild
                    key={item.href}
                    onSelect={() => setOpen(false)}
                  >
                    <Link to={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      )}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
