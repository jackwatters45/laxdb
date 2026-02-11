import { cn } from "@laxdb/ui/lib/utils";

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

      <p className="text-label text-xs">{code}</p>
      <h1 className="mt-4 text-center font-serif text-5xl text-foreground italic sm:text-7xl">
        {title}
      </h1>
      <p className="mt-6 max-w-md text-center text-base text-balance text-muted-foreground">
        {description}
      </p>

      {children && <div className="mt-8 flex items-center gap-3">{children}</div>}
    </main>
  );
}

function NotFoundAction({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border-b-[1.5px] border-foreground/20 bg-foreground px-5 py-3 text-sm leading-4 font-medium tracking-wide text-background shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(255,255,255,0.19)] transition-all duration-200 hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

function NotFoundSecondaryAction({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border border-border bg-background px-5 py-3 text-sm leading-4 font-medium tracking-wide text-foreground transition-all duration-200 hover:bg-accent",
        className,
      )}
      type="button"
      {...props}
    />
  );
}

export { NotFound, NotFoundAction, NotFoundSecondaryAction };
