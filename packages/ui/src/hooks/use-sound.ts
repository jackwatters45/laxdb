import { useState, useEffect } from "react";
import useSound_ from "use-sound";

interface HookOptions {
  id?: string;
  volume?: number;
  playbackRate?: number;
  interrupt?: boolean;
  soundEnabled?: boolean;
  sprite?: { [key: string]: [number, number] };
  onload?: () => void;
}

interface PlayOptions {
  id?: string;
  forceSoundEnabled?: boolean;
  playbackRate?: number;
}

type PlayFunction = (options?: PlayOptions) => void;

export function useSound(path: string, options?: HookOptions): PlayFunction {
  const isTouchDevice = useMediaQuery("(hover: none)");
  const isTinyDevice = useMediaQuery("(max-width: 480px)");
  const isMobile = isTouchDevice || isTinyDevice;

  const [play] = useSound_(path, {
    soundEnabled: !isMobile,
    ...options,
  });

  return play;
}

function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener("change", handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener("change", handleChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return matches;
}
