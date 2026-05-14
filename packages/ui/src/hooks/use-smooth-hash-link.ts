import { useCallback, type MouseEventHandler } from "react";

import { scrollToHash } from "../lib/smooth-scroll";

export type UseSmoothHashLinkOptions = {
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  replace?: boolean;
};

export function useSmoothHashLink({
  href,
  onClick,
  replace = false,
}: UseSmoothHashLinkOptions): MouseEventHandler<HTMLAnchorElement> {
  return useCallback(
    (event) => {
      onClick?.(event);

      if (
        !href?.startsWith("#") ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (!scrollToHash(href)) {
        return;
      }

      event.preventDefault();

      if (replace) {
        window.history.replaceState(null, "", href);
        return;
      }

      window.history.pushState(null, "", href);
    },
    [href, onClick, replace],
  );
}
