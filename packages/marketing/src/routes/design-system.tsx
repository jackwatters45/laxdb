import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/design-system")({
  component: DesignSystem,
});

/* ─── Token data ─── */

const CORE_COLORS = [
  {
    name: "background",
    light: "oklch(0.98 0 0)",
    dark: "oklch(0.11 0 0)",
    variable: "--background",
  },
  {
    name: "foreground",
    light: "oklch(0.17 0 0)",
    dark: "oklch(0.95 0 0)",
    variable: "--foreground",
  },
  { name: "muted", light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)", variable: "--muted" },
  {
    name: "muted-foreground",
    light: "oklch(0.51 0 0)",
    dark: "oklch(0.63 0 0)",
    variable: "--muted-foreground",
  },
  { name: "accent", light: "oklch(0.91 0 0)", dark: "oklch(0.22 0 0)", variable: "--accent" },
  {
    name: "accent-foreground",
    light: "oklch(0.17 0 0)",
    dark: "oklch(0.95 0 0)",
    variable: "--accent-foreground",
  },
  { name: "subtle", light: "oklch(0.63 0 0)", dark: "oklch(0.51 0 0)", variable: "--subtle" },
  { name: "border", light: "oklch(0.93 0 0)", dark: "oklch(0.24 0 0)", variable: "--border" },
  {
    name: "border-strong",
    light: "oklch(0.89 0 0)",
    dark: "oklch(0.30 0 0)",
    variable: "--border-strong",
  },
  { name: "bullet", light: "oklch(0.82 0 0)", dark: "oklch(0.37 0 0)", variable: "--bullet" },
] as const;

const STATUS_COLORS = [
  {
    name: "destructive",
    light: "oklch(0.58 0.22 27)",
    dark: "oklch(0.704 0.191 22)",
    variable: "--destructive",
  },
  {
    name: "success",
    light: "oklch(0.55 0.15 145)",
    dark: "oklch(0.65 0.18 145)",
    variable: "--success",
  },
  {
    name: "warning",
    light: "oklch(0.75 0.18 70)",
    dark: "oklch(0.8 0.16 70)",
    variable: "--warning",
  },
  {
    name: "orange",
    light: "oklch(0.55 0.12 50)",
    dark: "oklch(0.65 0.14 50)",
    variable: "--orange",
  },
] as const;

const APP_COLORS = [
  { name: "card", light: "oklch(1 0 0)", dark: "oklch(0.205 0 0)", variable: "--card" },
  { name: "popover", light: "oklch(1 0 0)", dark: "oklch(0.205 0 0)", variable: "--popover" },
  { name: "primary", light: "oklch(0.205 0 0)", dark: "oklch(0.87 0 0)", variable: "--primary" },
  {
    name: "secondary",
    light: "oklch(0.97 0 0)",
    dark: "oklch(0.269 0 0)",
    variable: "--secondary",
  },
  { name: "input", light: "oklch(0.93 0 0)", dark: "oklch(0.24 0 0)", variable: "--input" },
  { name: "ring", light: "oklch(0.708 0 0)", dark: "oklch(0.556 0 0)", variable: "--ring" },
] as const;

const SIDEBAR_COLORS = [
  { name: "sidebar", light: "oklch(0.985 0 0)", dark: "oklch(0.205 0 0)", variable: "--sidebar" },
  {
    name: "sidebar-primary",
    light: "oklch(0.205 0 0)",
    dark: "oklch(0.488 0.243 264)",
    variable: "--sidebar-primary",
  },
  {
    name: "sidebar-accent",
    light: "oklch(0.97 0 0)",
    dark: "oklch(0.269 0 0)",
    variable: "--sidebar-accent",
  },
  {
    name: "sidebar-border",
    light: "oklch(0.922 0 0)",
    dark: "oklch(1 0 0 / 10%)",
    variable: "--sidebar-border",
  },
] as const;

const CHART_COLORS = [
  {
    name: "chart-1",
    light: "oklch(0.809 0.105 252)",
    dark: "oklch(0.809 0.105 252)",
    variable: "--chart-1",
  },
  {
    name: "chart-2",
    light: "oklch(0.623 0.214 260)",
    dark: "oklch(0.623 0.214 260)",
    variable: "--chart-2",
  },
  {
    name: "chart-3",
    light: "oklch(0.546 0.245 263)",
    dark: "oklch(0.546 0.245 263)",
    variable: "--chart-3",
  },
  {
    name: "chart-4",
    light: "oklch(0.488 0.243 264)",
    dark: "oklch(0.488 0.243 264)",
    variable: "--chart-4",
  },
  {
    name: "chart-5",
    light: "oklch(0.424 0.199 266)",
    dark: "oklch(0.424 0.199 266)",
    variable: "--chart-5",
  },
] as const;

/* ─── Components ─── */

function ColorRow({
  name,
  light,
  dark,
  variable,
}: {
  name: string;
  light: string;
  dark: string;
  variable: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-2">
      <div className="flex gap-1">
        <div
          className="size-7 rounded-sm border border-border"
          style={{ backgroundColor: light }}
        />
        <div className="size-7 rounded-sm border border-border" style={{ backgroundColor: dark }} />
      </div>
      <span className="min-w-24 text-sm text-foreground">{name}</span>
      <code className="ml-auto text-xs text-subtle tabular-nums">{variable}</code>
    </div>
  );
}

function ColorGroup({
  title,
  colors,
}: {
  title: string;
  colors: ReadonlyArray<{ name: string; light: string; dark: string; variable: string }>;
}) {
  return (
    <div>
      <h3 className="text-label mb-3 text-xs">{title}</h3>
      {colors.map((c) => (
        <ColorRow key={c.variable} {...c} />
      ))}
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px bg-border" />;
}

function DesignSystem() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:py-32">
      <header className="mb-12">
        <h1 className="font-serif text-3xl text-foreground italic md:text-4xl">Design System</h1>
        <p className="mt-4 text-muted-foreground">
          Unified design tokens and conventions. Single source of truth.
        </p>
      </header>

      <div className="space-y-14">
        {/* ─── Colors ─── */}
        <section>
          <h2 className="mb-6 font-serif text-xl text-foreground italic">Color</h2>
          <div className="space-y-8">
            <ColorGroup title="Core" colors={CORE_COLORS} />
            <ColorGroup title="Status" colors={STATUS_COLORS} />
            <ColorGroup title="App-specific" colors={APP_COLORS} />
            <ColorGroup title="Sidebar" colors={SIDEBAR_COLORS} />
            <ColorGroup title="Chart" colors={CHART_COLORS} />
          </div>
        </section>

        <SectionDivider />

        {/* ─── Typography ─── */}
        <section>
          <h2 className="mb-6 font-serif text-xl text-foreground italic">Typography</h2>

          <div className="space-y-8">
            {/* Newsreader */}
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-label text-xs">Display / Headings</p>
                <code className="text-xs text-subtle tabular-nums">--font-serif</code>
              </div>
              <p className="mt-2 font-serif text-4xl text-foreground italic">Newsreader</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Italic only for headings and emphasis. Self-hosted TTF. Provides editorial
                character.
              </p>
            </div>

            {/* Helvetica Neue */}
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-label text-xs">Body / UI</p>
                <code className="text-xs text-subtle tabular-nums">--font-sans</code>
              </div>
              <p className="mt-2 font-sans text-4xl font-light tracking-tight text-foreground">
                Helvetica Neue
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                System fallback stack: Helvetica Neue, Helvetica, Inter, system sans-serif.
              </p>
            </div>

            {/* DM Sans (archived) */}
            <div className="opacity-50">
              <div className="flex items-baseline justify-between">
                <p className="text-label text-xs">Archived</p>
                <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-subtle">
                  deprecated
                </span>
              </div>
              <p
                className="mt-2 text-4xl text-foreground"
                style={{ fontFamily: "DM Sans Variable, DM Sans, sans-serif" }}
              >
                DM Sans Variable
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Previously used for app body text. Replaced by system font stack.
              </p>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ─── Utilities ─── */}
        <section>
          <h2 className="mb-6 font-serif text-xl text-foreground italic">Utilities</h2>
          <div className="space-y-4">
            <div className="rounded-sm border border-border p-5">
              <div className="flex items-baseline justify-between">
                <code className="text-sm text-foreground">.text-label</code>
                <code className="text-xs text-subtle tabular-nums">
                  tracking + uppercase + subtle
                </code>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <span className="text-label text-xs">Live example of text-label</span>
              </div>
              <pre className="mt-3 rounded-sm bg-accent p-3 text-xs text-foreground">
                {`letter-spacing: 0.1em;
text-transform: uppercase;
color: var(--color-subtle);`}
              </pre>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ─── Spacing & Radius ─── */}
        <section>
          <h2 className="mb-6 font-serif text-xl text-foreground italic">Spacing & Radius</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Marketing uses Tailwind defaults with sharp corners. App uses custom radius tokens.
          </p>
          <div className="space-y-2">
            {[
              { name: "radius", value: "0.45rem" },
              { name: "radius-sm", value: "calc(var(--radius) - 4px)" },
              { name: "radius-md", value: "calc(var(--radius) - 2px)" },
              { name: "radius-lg", value: "var(--radius)" },
            ].map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between border-b border-border pb-2"
              >
                <span className="text-sm text-foreground">{r.name}</span>
                <code className="text-xs text-subtle tabular-nums">{r.value}</code>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ─── Motion ─── */}
        <section>
          <h2 className="mb-6 font-serif text-xl text-foreground italic">Motion</h2>
          <div className="space-y-2 text-sm">
            {[
              { name: "dashes", timing: "0.8s linear infinite" },
              { name: "dashes-reverse", timing: "0.8s linear infinite reverse" },
              { name: "hover", timing: "4s ease-in-out infinite" },
              { name: "gridMovingLine", timing: "keyframe only (no utility)" },
              { name: "smooth-bounce", timing: "cubic-bezier(0.16, 1, 0.3, 1.03)" },
              { name: "tw-animate-css", timing: "Plugin (enter/exit/fade)" },
            ].map((a) => (
              <div
                key={a.name}
                className="flex items-center justify-between border-b border-border pb-2"
              >
                <span className="text-foreground">{a.name}</span>
                <code className="text-xs text-subtle">{a.timing}</code>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ─── Dark Mode ─── */}
        <section>
          <h2 className="mb-6 font-serif text-xl text-foreground italic">Dark Mode</h2>
          <div className="rounded-sm border border-border p-3 text-xs text-foreground">
            <p>
              Clean <code className="text-foreground">.dark</code> class swaps CSS vars in{" "}
              <code className="text-foreground">:root</code> /{" "}
              <code className="text-foreground">.dark</code>. No{" "}
              <code className="text-foreground">!important</code> overrides.
            </p>
            <p className="mt-2">
              All components use semantic tokens (
              <code className="text-foreground">bg-background</code>,{" "}
              <code className="text-foreground">text-foreground</code>) so dark mode is automatic.
            </p>
          </div>
        </section>

        <SectionDivider />

        {/* ─── Source ─── */}
        <section>
          <h2 className="mb-6 font-serif text-xl text-foreground italic">Source</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3 border-b border-border pb-2">
              <code className="shrink-0 text-xs text-foreground tabular-nums">
                packages/ui/src/globals.css
              </code>
              <span className="text-xs text-muted-foreground">
                Single source of truth — all tokens, fonts, base styles, utilities
              </span>
            </div>
            <div className="flex items-start gap-3 border-b border-border pb-2">
              <code className="shrink-0 text-xs text-foreground tabular-nums">
                packages/marketing/src/globals.css
              </code>
              <span className="text-xs text-muted-foreground">
                One-line import: @import "@laxdb/ui/globals.css"
              </span>
            </div>
            <div className="flex items-start gap-3">
              <code className="shrink-0 text-xs text-foreground tabular-nums">
                packages/web/src/globals.css
              </code>
              <span className="text-xs text-muted-foreground">
                One-line import: @import "@laxdb/ui/globals.css"
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
