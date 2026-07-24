import { Link } from "@tanstack/react-router";

export function TeamPageHeader(props: {
  readonly teamId: string;
  readonly teamName: string;
  readonly title?: string;
  readonly description?: string;
  readonly actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/teams"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            ← All teams
          </Link>
          <h1 className="text-balance text-3xl font-semibold">
            {props.title ?? props.teamName}
          </h1>
          {props.description && (
            <p className="text-pretty text-sm text-muted-foreground">
              {props.description}
            </p>
          )}
        </div>
        {props.actions}
      </div>
      <nav
        aria-label={`${props.teamName} sections`}
        className="flex flex-wrap gap-x-5 gap-y-2 border-b pb-3 text-sm"
      >
        <Link
          to="/teams/$teamId"
          params={{ teamId: props.teamId }}
          activeOptions={{ exact: true }}
          className="underline-offset-4 hover:underline"
          activeProps={{
            className: "font-medium underline underline-offset-4",
          }}
        >
          Overview
        </Link>
        <Link
          to="/teams/$teamId/fixtures"
          params={{ teamId: props.teamId }}
          className="underline-offset-4 hover:underline"
          activeProps={{
            className: "font-medium underline underline-offset-4",
          }}
        >
          Fixtures
        </Link>
        <Link
          to="/teams/$teamId/reports"
          params={{ teamId: props.teamId }}
          className="underline-offset-4 hover:underline"
          activeProps={{
            className: "font-medium underline underline-offset-4",
          }}
        >
          Reports
        </Link>
        <Link
          to="/teams/$teamId/photos"
          params={{ teamId: props.teamId }}
          className="underline-offset-4 hover:underline"
          activeProps={{
            className: "font-medium underline underline-offset-4",
          }}
        >
          Photos
        </Link>
        <Link
          to="/teams/$teamId/roster"
          params={{ teamId: props.teamId }}
          className="underline-offset-4 hover:underline"
          activeProps={{
            className: "font-medium underline underline-offset-4",
          }}
        >
          Roster
        </Link>
        <Link
          to="/teams/$teamId/standings"
          params={{ teamId: props.teamId }}
          className="underline-offset-4 hover:underline"
          activeProps={{
            className: "font-medium underline underline-offset-4",
          }}
        >
          Standings
        </Link>
        <Link
          to="/teams/$teamId/stats"
          params={{ teamId: props.teamId }}
          className="underline-offset-4 hover:underline"
          activeProps={{
            className: "font-medium underline underline-offset-4",
          }}
        >
          Stats
        </Link>
      </nav>
    </header>
  );
}
