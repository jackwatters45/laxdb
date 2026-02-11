import { Logo } from "@laxdb/ui/components/logo";
import { createFileRoute } from "@tanstack/react-router";

const PALETTE = [
  {
    name: "Background",
    variable: "--color-background",
    light: "oklch(0.98 0 0)",
    dark: "oklch(0.11 0 0)",
  },
  {
    name: "Foreground",
    variable: "--color-foreground",
    light: "oklch(0.17 0 0)",
    dark: "oklch(0.95 0 0)",
  },
  { name: "Muted", variable: "--color-muted", light: "oklch(0.51 0 0)", dark: "oklch(0.63 0 0)" },
  { name: "Subtle", variable: "--color-subtle", light: "oklch(0.63 0 0)", dark: "oklch(0.51 0 0)" },
  { name: "Accent", variable: "--color-accent", light: "oklch(0.91 0 0)", dark: "oklch(0.22 0 0)" },
  { name: "Border", variable: "--color-border", light: "oklch(0.93 0 0)", dark: "oklch(0.24 0 0)" },
  {
    name: "Border Strong",
    variable: "--color-border-strong",
    light: "oklch(0.89 0 0)",
    dark: "oklch(0.30 0 0)",
  },
  { name: "Bullet", variable: "--color-bullet", light: "oklch(0.82 0 0)", dark: "oklch(0.37 0 0)" },
  {
    name: "Orange",
    variable: "--color-orange",
    light: "oklch(0.55 0.12 50)",
    dark: "oklch(0.65 0.14 50)",
  },
] as const;

export const Route = createFileRoute("/brand")({
  component: BrandGuidelines,
});

function BrandGuidelines() {
  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-12">
        <h1 className="font-serif text-3xl text-foreground italic md:text-4xl">Brand Guidelines</h1>
        <p className="mt-4 text-muted-foreground">
          Visual identity and design reference for LaxDB.
        </p>
      </header>

      <div className="space-y-14">
        {/* Logo */}
        <section>
          <h2 className="mb-6 font-serif text-lg text-foreground italic">Logo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex aspect-[4/3] items-center justify-center rounded-sm border border-border bg-[#171717]">
              <div className="flex items-center gap-3">
                <Logo className="size-8" />
                <span className="text-xl font-medium tracking-tight text-white">LaxDB</span>
              </div>
            </div>
            <div className="flex aspect-[4/3] items-center justify-center rounded-sm border border-border bg-[#f8f8f8]">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-[#171717]" />
                <span className="text-xl font-medium tracking-tight text-[#171717]">LaxDB</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-foreground">
            <p>
              The mark is a circle — a deliberate reduction. It references the lacrosse ball while
              signaling that LaxDB is a platform, not a league or media brand.
            </p>
            <p className="text-muted-foreground">
              Minimum clear space: 1x the diameter of the mark on all sides.
            </p>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Typography */}
        <section>
          <h2 className="mb-6 font-serif text-lg text-foreground italic">Typography</h2>
          <div className="space-y-8">
            <div>
              <p className="text-label mb-2 text-xs">Display / Headings</p>
              <p className="font-serif text-4xl text-foreground italic">Newsreader</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Optical sizes, italic only for headings. Weight 400. Provides editorial character
                without nostalgia.
              </p>
            </div>
            <div>
              <p className="text-label mb-2 text-xs">Body / UI</p>
              <p className="text-4xl font-light tracking-tight text-foreground">Helvetica Neue</p>
              <p className="mt-2 text-sm text-muted-foreground">
                System fallback stack: Helvetica Neue, Helvetica, Inter, system sans-serif. Clean,
                invisible, lets the content lead.
              </p>
            </div>
            <div className="rounded-sm border border-border p-5">
              <p className="text-label mb-3 text-xs">Scale</p>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                  <span className="font-serif text-2xl text-foreground italic">Page Title</span>
                  <span className="text-xs text-subtle tabular-nums">text-2xl / text-3xl</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                  <span className="font-serif text-lg text-foreground italic">Section Heading</span>
                  <span className="text-xs text-subtle tabular-nums">text-lg</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                  <span className="text-[15px] text-foreground">Body text at fifteen pixels</span>
                  <span className="text-xs text-subtle tabular-nums">15px / relaxed</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground">Secondary and metadata</span>
                  <span className="text-xs text-subtle tabular-nums">text-sm</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-subtle">Tertiary labels and dates</span>
                  <span className="text-xs text-subtle tabular-nums">text-xs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Color */}
        <section>
          <h2 className="mb-6 font-serif text-lg text-foreground italic">Color</h2>
          <p className="mb-6 text-sm text-foreground">
            Monochrome core in OKLCH for perceptual uniformity. Each value has a defined role. Dark
            mode inverts the scale. The single accent color — a burnt orange inspired by the
            lacrosse goal — is the only chromatic exception.
          </p>
          <div className="space-y-3">
            {PALETTE.map((color) => (
              <div
                key={color.variable}
                className="flex items-center gap-4 border-b border-border pb-3"
              >
                <div className="flex gap-1.5">
                  <div
                    className="size-8 rounded-sm border border-border"
                    style={{ backgroundColor: color.light }}
                  />
                  <div
                    className="size-8 rounded-sm border border-border"
                    style={{ backgroundColor: color.dark }}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-foreground">{color.name}</span>
                </div>
                <code className="text-xs text-subtle tabular-nums">{color.variable}</code>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Voice */}
        <section>
          <h2 className="mb-6 font-serif text-lg text-foreground italic">Voice</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-foreground">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label mb-2 text-xs">Do</p>
                <ul className="space-y-1.5 text-sm text-foreground">
                  <li>State facts plainly</li>
                  <li>Be specific over general</li>
                  <li>Respect the reader's time</li>
                  <li>Let data speak</li>
                </ul>
              </div>
              <div>
                <p className="text-label mb-2 text-xs">Don't</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>Hype or exaggerate</li>
                  <li>Use jargon for its own sake</li>
                  <li>Editorialize in data contexts</li>
                  <li>Add filler or qualifiers</li>
                </ul>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The tone is knowledgeable but not academic. Direct but not blunt. We write like
              someone who watches a lot of lacrosse and happens to understand databases.
            </p>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Principles */}
        <section>
          <h2 className="mb-6 font-serif text-lg text-foreground italic">Design Principles</h2>
          <div className="space-y-5 text-[15px] leading-relaxed text-foreground">
            <div>
              <p className="font-medium text-foreground">Data over decoration</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every visual element should serve comprehension. Ornament is noise.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Monochrome discipline</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Restraint in color forces clarity in layout and typography. Color is reserved for
                data visualization where it serves a semantic purpose.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Editorial quality</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The reading experience should feel like a well-typeset publication, not a SaaS
                dashboard. Serif headings, generous spacing, considered hierarchy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
