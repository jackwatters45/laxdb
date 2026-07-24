import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="w-full px-4 pt-32 pb-36 md:pt-40 md:pb-44">
      <div className="mx-auto max-w-6xl border-x border-border">
        <section
          aria-labelledby="home-title"
          className="px-6 pt-10 pb-14 sm:px-10 md:pt-14 md:pb-16 lg:px-14"
        >
          <h1
            className="max-w-3xl border-l-2 border-orange pl-4 font-serif text-4xl leading-tight text-balance text-foreground italic md:text-5xl"
            id="home-title"
          >
            The open database for lacrosse.
          </h1>

          <div className="mt-8 max-w-3xl space-y-4 text-base leading-7 text-pretty text-foreground/80">
            <p>
              LaxDB brings player, team, and game records from professional lacrosse into one
              searchable source. We collect data from the PLL, NLL, MLL, MSL, and WLA, then
              normalize it so seasons and careers can be followed in one place.
            </p>
            <p>
              The project is part database, part field guide. Browse the wiki to learn the sport,
              follow connections through the graph, or inspect the work on GitHub.
            </p>
          </div>

          <nav aria-label="Explore LaxDB" className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              className="underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
              to="/wiki"
            >
              Browse the wiki →
            </Link>
            <Link
              className="underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
              to="/graph"
            >
              Explore the graph →
            </Link>
          </nav>
        </section>

        <section aria-labelledby="coverage-title" className="border-t border-border">
          <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:px-10 lg:px-14">
            <h2 className="font-serif text-lg text-foreground italic" id="coverage-title">
              League coverage
            </h2>
            <p className="text-sm text-pretty text-muted-foreground">
              Current competition and historical records, kept in a common format.
            </p>
          </div>
          <ul className="grid grid-cols-2 border-t border-border lg:grid-cols-5">
            <li className="min-w-0 px-5 py-5 sm:px-7">
              <p className="font-medium text-foreground">PLL</p>
              <p
                className="mt-1 text-xs leading-5 text-pretty text-muted-foreground"
                title="Premier Lacrosse League"
              >
                Premier Lacrosse League
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Field</p>
            </li>
            <li className="min-w-0 border-l border-border px-5 py-5 sm:px-7">
              <p className="font-medium text-foreground">NLL</p>
              <p
                className="mt-1 text-xs leading-5 text-pretty text-muted-foreground"
                title="National Lacrosse League"
              >
                National Lacrosse League
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Box</p>
            </li>
            <li className="min-w-0 border-t border-border px-5 py-5 sm:px-7 lg:border-t-0 lg:border-l">
              <p className="font-medium text-foreground">MLL</p>
              <p
                className="mt-1 text-xs leading-5 text-pretty text-muted-foreground"
                title="Major League Lacrosse"
              >
                Major League Lacrosse
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Archive</p>
            </li>
            <li className="min-w-0 border-t border-l border-border px-5 py-5 sm:px-7 lg:border-t-0">
              <p className="font-medium text-foreground">MSL</p>
              <p
                className="mt-1 text-xs leading-5 text-pretty text-muted-foreground"
                title="Major Series Lacrosse"
              >
                Major Series Lacrosse
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Senior A</p>
            </li>
            <li className="min-w-0 border-t border-border px-5 py-5 sm:px-7 lg:border-t-0 lg:border-l">
              <p className="font-medium text-foreground">WLA</p>
              <p
                className="mt-1 text-xs leading-5 text-pretty text-muted-foreground"
                title="Western Lacrosse Association"
              >
                Western Lacrosse Association
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Senior A</p>
            </li>
          </ul>
        </section>

        <section aria-labelledby="inside-title" className="border-t border-border">
          <div className="px-6 py-8 sm:px-10 lg:px-14">
            <h2 className="font-serif text-2xl text-foreground italic" id="inside-title">
              What is in LaxDB
            </h2>
          </div>

          <div className="border-t border-border">
            <article className="grid gap-5 px-6 py-9 sm:px-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-12 lg:px-14">
              <header>
                <p className="text-xs font-medium text-muted-foreground tabular-nums">01</p>
                <h3 className="mt-2 font-serif text-2xl text-balance text-foreground italic">
                  League records
                </h3>
              </header>
              <div className="max-w-2xl">
                <p className="leading-7 text-pretty text-foreground/80">
                  Scores, standings, rosters, and season statistics from leagues that publish their
                  history in different formats — or no longer publish it at all.
                </p>
                <Link
                  className="mt-4 inline-block text-sm underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
                  to="/wiki"
                >
                  Read the league guide →
                </Link>
              </div>
            </article>

            <article className="grid gap-5 border-t border-border px-6 py-9 sm:px-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-12 lg:px-14">
              <header>
                <p className="text-xs font-medium text-muted-foreground tabular-nums">02</p>
                <h3 className="mt-2 font-serif text-2xl text-balance text-foreground italic">
                  Player histories
                </h3>
              </header>
              <div className="max-w-2xl">
                <p className="leading-7 text-pretty text-foreground/80">
                  Follow careers across teams, leagues, and eras. LaxDB keeps identities and
                  statistics connected when a player changes clubs or moves between field and box.
                </p>
                <Link
                  className="mt-4 inline-block text-sm underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
                  to="/graph"
                >
                  Trace a career →
                </Link>
              </div>
            </article>

            <article className="grid gap-5 border-t border-border px-6 py-9 sm:px-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-12 lg:px-14">
              <header>
                <p className="text-xs font-medium text-muted-foreground tabular-nums">03</p>
                <h3 className="mt-2 font-serif text-2xl text-balance text-foreground italic">
                  A connected history
                </h3>
              </header>
              <div className="max-w-2xl">
                <p className="leading-7 text-pretty text-foreground/80">
                  The knowledge graph links players, teams, seasons, and competitions so the story
                  behind the numbers can be explored instead of flattened into a table.
                </p>
                <Link
                  className="mt-4 inline-block text-sm underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
                  to="/graph"
                >
                  Open the graph →
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="open-source-title"
          className="grid gap-5 border-y border-border px-6 py-10 sm:px-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-12 lg:px-14"
        >
          <h2
            className="font-serif text-2xl text-balance text-foreground italic"
            id="open-source-title"
          >
            Built in public
          </h2>
          <div className="max-w-2xl">
            <p className="leading-7 text-pretty text-foreground/80">
              LaxDB is open source. The data pipeline, API, and website are public so corrections
              can be checked, gaps can be documented, and the sport&apos;s record does not depend on
              a single league website staying online.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                className="underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
                href="https://github.com/jackwatters45/laxdb"
                rel="noopener noreferrer"
                target="_blank"
              >
                View the source ↗
              </a>
              <Link
                className="underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
                to="/changelog"
              >
                Read the changelog →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
