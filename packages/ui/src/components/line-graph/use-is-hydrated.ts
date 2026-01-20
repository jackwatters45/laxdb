import * as React from "react";
import { useIsomorphicLayoutEffect } from "motion/react";

let globalIsHydrated = false;

/** Returns whether the app has been hydrated. */
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = React.useState(globalIsHydrated);

  useIsomorphicLayoutEffect(() => {
    setIsHydrated(true);
    globalIsHydrated = true;
  }, []);

  return isHydrated;
}
