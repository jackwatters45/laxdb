import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-12">
        <h1 className="font-serif text-3xl text-foreground italic md:text-4xl">About LaxDB</h1>
        <p className="mt-4 text-muted-foreground">The lacrosse data platform.</p>
      </header>

      <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
        <section>
          <h2 className="mb-4 font-serif text-lg text-foreground italic">What we do</h2>
          <p>
            LaxDB is building the definitive data layer for professional lacrosse. We aggregate,
            normalize, and serve statistics across the PLL, NLL, MLL, MSL, and WLA — leagues that
            have historically kept their data siloed and inconsistent.
          </p>
          <p className="mt-3">
            The result is a single platform where player careers can be traced across leagues and
            eras, where game data is structured and queryable, and where the sport&apos;s history is
            preserved in a format that&apos;s actually useful.
          </p>
        </section>

        <div className="h-px bg-border" />

        <section>
          <h2 className="mb-4 font-serif text-lg text-foreground italic">Why it matters</h2>
          <p>
            Lacrosse is the fastest-growing sport in North America but its data infrastructure
            hasn&apos;t kept pace. Box scores disappear when league websites shut down. Career stats
            are scattered across PDFs, spreadsheets, and defunct websites. Comparing a PLL
            attackman&apos;s production to an NLL forward&apos;s requires manual work that almost
            nobody does.
          </p>
          <p className="mt-3">
            We think the sport deserves better. Good data doesn&apos;t just serve analysts — it
            deepens every fan&apos;s understanding of what they&apos;re watching.
          </p>
        </section>

        <div className="h-px bg-border" />

        <section>
          <h2 className="mb-4 font-serif text-lg text-foreground italic">How it works</h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-bullet" />
              <span>
                <strong className="text-foreground">Pipeline</strong> — automated ingestion from
                league APIs, historical archives, and structured scraping of public sources.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-bullet" />
              <span>
                <strong className="text-foreground">Normalization</strong> — unified schemas that
                reconcile different league formats, naming conventions, and statistical categories.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-bullet" />
              <span>
                <strong className="text-foreground">Knowledge graph</strong> — entities linked by
                relationships (teammates, opponents, career paths) enabling discovery and analysis.
              </span>
            </li>
          </ul>
        </section>

        <div className="h-px bg-border" />

        <section>
          <h2 className="mb-4 font-serif text-lg text-foreground italic">Open source</h2>
          <p>
            LaxDB is open source. The data pipeline, API, and this website are all public. We
            believe lacrosse data should be accessible to everyone — fans, journalists, coaches,
            analysts, and developers building tools for the sport.
          </p>
          <p className="mt-4">
            <a
              href="https://github.com/jackwatters45/laxdb"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </section>

        <div className="h-px bg-border" />

        <section>
          <h2 className="mb-4 font-serif text-lg text-foreground italic">Contact</h2>
          <p>
            For questions, data corrections, or partnership inquiries:{" "}
            <a
              href="mailto:jack@laxdb.io"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              jack@laxdb.io
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
