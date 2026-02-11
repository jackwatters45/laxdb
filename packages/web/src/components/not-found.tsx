import { NotFound as NotFoundBase, NotFoundSecondaryAction } from "@laxdb/ui/components/not-found";
import { Link } from "@tanstack/react-router";

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <NotFoundBase>
      {children ?? (
        <>
          <NotFoundSecondaryAction
            onClick={() => {
              window.history.back();
            }}
          >
            Go Back
          </NotFoundSecondaryAction>
          <Link
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border-b-[1.5px] border-foreground/20 bg-foreground px-5 py-3 text-sm leading-4 font-medium tracking-wide text-background shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(255,255,255,0.19)] transition-all duration-200 hover:opacity-90"
            to="/"
          >
            Go Home
          </Link>
        </>
      )}
    </NotFoundBase>
  );
}
