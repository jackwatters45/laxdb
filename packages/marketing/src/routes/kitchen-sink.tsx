import { Alert, AlertDescription, AlertTitle } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Checkbox } from "@laxdb/ui/components/ui/checkbox";
import { Input } from "@laxdb/ui/components/ui/input";
import { Kbd } from "@laxdb/ui/components/ui/kbd";
import { Label } from "@laxdb/ui/components/ui/label";
import { Progress } from "@laxdb/ui/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@laxdb/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Skeleton } from "@laxdb/ui/components/ui/skeleton";
import { Slider } from "@laxdb/ui/components/ui/slider";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { Switch } from "@laxdb/ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@laxdb/ui/components/ui/tabs";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { Toggle } from "@laxdb/ui/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@laxdb/ui/components/ui/tooltip";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kitchen-sink")({
  component: KitchenSinkPage,
});

const COLOR_TOKENS = [
  { name: "background", var: "--background" },
  { name: "foreground", var: "--foreground" },
  { name: "card", var: "--card" },
  { name: "card-foreground", var: "--card-foreground" },
  { name: "popover", var: "--popover" },
  { name: "popover-foreground", var: "--popover-foreground" },
  { name: "primary", var: "--primary" },
  { name: "primary-foreground", var: "--primary-foreground" },
  { name: "secondary", var: "--secondary" },
  { name: "secondary-foreground", var: "--secondary-foreground" },
  { name: "muted", var: "--muted" },
  { name: "muted-foreground", var: "--muted-foreground" },
  { name: "accent", var: "--accent" },
  { name: "accent-foreground", var: "--accent-foreground" },
  { name: "destructive", var: "--destructive" },
  { name: "destructive-foreground", var: "--destructive-foreground" },
  { name: "success", var: "--success" },
  { name: "success-foreground", var: "--success-foreground" },
  { name: "warning", var: "--warning" },
  { name: "warning-foreground", var: "--warning-foreground" },
  { name: "orange", var: "--orange" },
  { name: "orange-foreground", var: "--orange-foreground" },
  { name: "border", var: "--border" },
  { name: "border-strong", var: "--border-strong" },
  { name: "bullet", var: "--bullet" },
  { name: "input", var: "--input" },
  { name: "ring", var: "--ring" },
  { name: "subtle", var: "--subtle" },
] as const;

const CHART_TOKENS = [
  { name: "chart-1", var: "--chart-1" },
  { name: "chart-2", var: "--chart-2" },
  { name: "chart-3", var: "--chart-3" },
  { name: "chart-4", var: "--chart-4" },
  { name: "chart-5", var: "--chart-5" },
] as const;

const SIDEBAR_TOKENS = [
  { name: "sidebar", var: "--sidebar" },
  { name: "sidebar-foreground", var: "--sidebar-foreground" },
  { name: "sidebar-primary", var: "--sidebar-primary" },
  { name: "sidebar-primary-foreground", var: "--sidebar-primary-foreground" },
  { name: "sidebar-accent", var: "--sidebar-accent" },
  { name: "sidebar-accent-foreground", var: "--sidebar-accent-foreground" },
  { name: "sidebar-border", var: "--sidebar-border" },
  { name: "sidebar-ring", var: "--sidebar-ring" },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <Separator />
      {children}
    </section>
  );
}

function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-md border border-border"
        style={{ backgroundColor: `oklch(var(${cssVar}))` }}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{name}</p>
        <p className="text-[0.625rem] text-muted-foreground">{cssVar}</p>
      </div>
    </div>
  );
}

function KitchenSinkPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-16">
      <div>
        <h1 className="font-serif text-4xl text-foreground italic">Kitchen Sink</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          All standard UI components and design tokens from @laxdb/ui
        </p>
      </div>

      {/* Color Tokens */}
      <Section title="Color Tokens">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {COLOR_TOKENS.map((token) => (
            <ColorSwatch key={token.name} name={token.name} cssVar={token.var} />
          ))}
        </div>
      </Section>

      {/* Chart Colors */}
      <Section title="Chart Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {CHART_TOKENS.map((token) => (
            <ColorSwatch key={token.name} name={token.name} cssVar={token.var} />
          ))}
        </div>
      </Section>

      {/* Sidebar Colors */}
      <Section title="Sidebar Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {SIDEBAR_TOKENS.map((token) => (
            <ColorSwatch key={token.name} name={token.name} cssVar={token.var} />
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-3">
          <p className="font-sans text-xs text-muted-foreground">Font Sans: Helvetica Neue</p>
          <p className="font-serif text-xs text-muted-foreground">Font Serif: Newsreader</p>
          <p className="font-mono text-xs text-muted-foreground">Font Mono: Newsreader</p>
          <Separator />
          <h1 className="font-serif text-5xl text-foreground italic">Heading 1 — Serif Italic</h1>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Heading 2 — Sans Semibold
          </h2>
          <h3 className="text-lg font-medium text-foreground">Heading 3 — Sans Medium</h3>
          <h4 className="text-sm font-medium text-foreground">Heading 4 — Sans Medium Small</h4>
          <p className="text-sm text-foreground">Body text — regular 14px</p>
          <p className="text-xs text-foreground">Small text — 12px</p>
          <p className="text-xs text-muted-foreground">Muted text — 12px muted</p>
          <p className="text-[0.625rem] text-muted-foreground">Tiny text — 10px muted</p>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Button">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="ghost-muted">Ghost Muted</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="bracket">Bracket</Button>
            <Button variant="bracket-ghost">Bracket Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      {/* Input */}
      <Section title="Input">
        <div className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="input-default">Default Input</Label>
            <Input id="input-default" placeholder="Type something..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="input-disabled">Disabled Input</Label>
            <Input id="input-disabled" placeholder="Disabled" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="input-file">File Input</Label>
            <Input id="input-file" type="file" />
          </div>
        </div>
      </Section>

      {/* Textarea */}
      <Section title="Textarea">
        <div className="max-w-sm space-y-1.5">
          <Label htmlFor="textarea-default">Description</Label>
          <Textarea id="textarea-default" placeholder="Write something..." />
        </div>
      </Section>

      {/* Select */}
      <Section title="Select">
        <div className="max-w-sm">
          <Select>
            <SelectTrigger>
              <SelectValue>{(value) => (value as string) ?? "Select a league..."}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pll">PLL</SelectItem>
              <SelectItem value="nll">NLL</SelectItem>
              <SelectItem value="mll">MLL</SelectItem>
              <SelectItem value="wla">WLA</SelectItem>
              <SelectItem value="msl">MSL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* Checkbox */}
      <Section title="Checkbox">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="check-1" defaultChecked />
            <Label htmlFor="check-1">Checked</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="check-2" />
            <Label htmlFor="check-2">Unchecked</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="check-3" disabled />
            <Label htmlFor="check-3">Disabled</Label>
          </div>
        </div>
      </Section>

      {/* Radio Group */}
      <Section title="Radio Group">
        <RadioGroup defaultValue="option-1" className="max-w-sm">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option-1" id="radio-1" />
            <Label htmlFor="radio-1">Option One</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option-2" id="radio-2" />
            <Label htmlFor="radio-2">Option Two</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option-3" id="radio-3" />
            <Label htmlFor="radio-3">Option Three</Label>
          </div>
        </RadioGroup>
      </Section>

      {/* Switch */}
      <Section title="Switch">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch id="switch-1" defaultChecked />
            <Label htmlFor="switch-1">Default (on)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="switch-2" />
            <Label htmlFor="switch-2">Default (off)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="switch-3" size="sm" defaultChecked />
            <Label htmlFor="switch-3">Small</Label>
          </div>
        </div>
      </Section>

      {/* Toggle */}
      <Section title="Toggle">
        <div className="flex flex-wrap items-center gap-2">
          <Toggle>Default</Toggle>
          <Toggle variant="outline">Outline</Toggle>
          <Toggle size="sm">Small</Toggle>
          <Toggle size="lg">Large</Toggle>
          <Toggle disabled>Disabled</Toggle>
        </div>
      </Section>

      {/* Slider */}
      <Section title="Slider">
        <div className="max-w-sm space-y-4">
          <Slider defaultValue={[33]} />
          <Slider defaultValue={[25, 75]} />
        </div>
      </Section>

      {/* Progress */}
      <Section title="Progress">
        <div className="max-w-sm space-y-4">
          <Progress value={25} />
          <Progress value={60} />
          <Progress value={100} />
        </div>
      </Section>

      {/* Card */}
      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Player Stats</CardTitle>
              <CardDescription>Season overview for 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                34 goals, 52 assists, 86 points across 18 games.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">View Details</Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Small Card</CardTitle>
              <CardDescription>Compact variant with size=sm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Uses tighter padding and gaps.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Alert */}
      <Section title="Alert">
        <div className="max-w-md space-y-3">
          <Alert>
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert with some informational text.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Destructive Alert</AlertTitle>
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <div className="space-y-4">
          <Tabs defaultValue="tab-1">
            <TabsList>
              <TabsTrigger value="tab-1">Overview</TabsTrigger>
              <TabsTrigger value="tab-2">Stats</TabsTrigger>
              <TabsTrigger value="tab-3">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="tab-1">
              <p className="text-xs text-muted-foreground">Overview tab content</p>
            </TabsContent>
            <TabsContent value="tab-2">
              <p className="text-xs text-muted-foreground">Stats tab content</p>
            </TabsContent>
            <TabsContent value="tab-3">
              <p className="text-xs text-muted-foreground">Settings tab content</p>
            </TabsContent>
          </Tabs>
          <Tabs defaultValue="tab-a">
            <TabsList variant="line">
              <TabsTrigger value="tab-a">Line A</TabsTrigger>
              <TabsTrigger value="tab-b">Line B</TabsTrigger>
              <TabsTrigger value="tab-c">Line C</TabsTrigger>
            </TabsList>
            <TabsContent value="tab-a">
              <p className="text-xs text-muted-foreground">Line variant tab content</p>
            </TabsContent>
            <TabsContent value="tab-b">
              <p className="text-xs text-muted-foreground">Line B content</p>
            </TabsContent>
            <TabsContent value="tab-c">
              <p className="text-xs text-muted-foreground">Line C content</p>
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      {/* Dialog */}
      <Section title="Dialog">
        <p className="text-xs text-muted-foreground">
          Dialog component available — uses Base UI Dialog primitive. Trigger with{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[0.625rem]">DialogTrigger</code>.
        </p>
      </Section>

      {/* Tooltip */}
      <Section title="Tooltip">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>This is a tooltip</TooltipContent>
        </Tooltip>
      </Section>

      {/* Kbd */}
      <Section title="Kbd">
        <div className="flex flex-wrap items-center gap-3">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>Enter</Kbd>
          <span className="text-xs text-muted-foreground">—</span>
          <span className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <span className="text-xs text-muted-foreground">+</span>
            <Kbd>K</Kbd>
          </span>
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton">
        <div className="max-w-sm space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      </Section>

      {/* Spinner */}
      <Section title="Spinner">
        <div className="flex items-center gap-4">
          <Spinner className="size-4" />
          <Spinner className="size-6" />
          <Spinner className="size-8" />
        </div>
      </Section>

      {/* Separator */}
      <Section title="Separator">
        <div className="space-y-4">
          <Separator />
          <div className="flex h-6 items-center gap-4">
            <span className="text-xs">Item 1</span>
            <Separator orientation="vertical" />
            <span className="text-xs">Item 2</span>
            <Separator orientation="vertical" />
            <span className="text-xs">Item 3</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
