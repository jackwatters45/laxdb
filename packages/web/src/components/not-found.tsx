import {
  NotFound as NotFoundBase,
  NotFoundAction,
  NotFoundSecondaryAction,
} from "@laxdb/ui/components/not-found";
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
            &larr; Go Back
          </NotFoundSecondaryAction>
          <NotFoundAction render={<Link to="/" />}>Go Home</NotFoundAction>
        </>
      )}
    </NotFoundBase>
  );
}
