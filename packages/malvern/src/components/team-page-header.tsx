export function TeamPageHeader(
  props: Readonly<{
    teamName: string;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
  }>,
) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
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
    </header>
  );
}
