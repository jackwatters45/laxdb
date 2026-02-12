import { cn } from "@laxdb/ui/lib/utils";

import { Button } from "./ui/button";

function DashedLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute inset-y-0 w-px", className)}
      style={{ maskImage: "linear-gradient(transparent, white 20%, white 80%, transparent)" }}
    >
      <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none">
        <line
          className="stroke-border"
          strokeDasharray="3 3"
          strokeWidth="2"
          x1="0"
          x2="0"
          y1="0"
          y2="100%"
        />
      </svg>
    </div>
  );
}

function NotFound({
  code = "404",
  title = "Page not found",
  description = "The page you\u2019re looking for doesn\u2019t exist or has been moved.",
  children,
  className,
}: {
  code?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "relative mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-4",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <DashedLine />
        <DashedLine className="right-0" />
      </div>

      <p className="text-[11px] tracking-[0.2em] text-subtle uppercase">{code}</p>
      <h1 className="mt-3 text-center font-serif text-5xl text-foreground italic sm:text-7xl">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-center text-base text-balance text-muted-foreground">
        {description}
      </p>

      {children && <div className="mt-8 flex items-center gap-4">{children}</div>}
    </main>
  );
}

function NotFoundAction({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button size="xl" variant="default" className={className} render={<a />} {...props} />;
}

function NotFoundSecondaryAction({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button size="xl" variant="ghost-muted" className={className} {...props} />;
}

export { NotFound, NotFoundAction, NotFoundSecondaryAction };
