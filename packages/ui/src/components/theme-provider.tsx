"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
  systemTheme?: "light" | "dark" | undefined;
};

const MEDIA = "(prefers-color-scheme: dark)";
const colorSchemes = new Set(["light", "dark"]);

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
  const media = e ?? window.matchMedia(MEDIA);
  return media.matches ? "dark" : "light";
};

const getTheme = (key: string, fallback?: string) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const disableAnimation = () => {
  const css = document.createElement("style");
  css.textContent =
    "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}";
  // oxlint-disable-next-line unicorn/prefer-dom-node-append
  document.head.appendChild(css);

  return () => {
    (() => window.getComputedStyle(document.body))();
    setTimeout(() => {
      css.remove();
    }, 1);
  };
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function ThemeScript({
  storageKey = "laxdb-ui-theme",
  defaultTheme = "system",
  attribute = "class",
  enableSystem = true,
}: Pick<ThemeProviderProps, "storageKey" | "defaultTheme" | "attribute" | "enableSystem">) {
  const themeScript = `
    (function() {
      function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      function updateDOM(theme) {
        const el = document.documentElement;
        if ('${attribute}' === 'class') {
          el.classList.remove('light', 'dark');
          el.classList.add(theme);
        } else {
          el.setAttribute('${attribute}', theme);
        }
        if (['light', 'dark'].includes(theme)) {
          el.style.colorScheme = theme;
        }
      }

      try {
        const stored = localStorage.getItem('${storageKey}') || '${defaultTheme}';
        const theme = ${enableSystem} && stored === 'system' ? getSystemTheme() : stored;
        updateDOM(theme);
      } catch (e) {
        updateDOM('${defaultTheme}');
      }
    })()
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "laxdb-ui-theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getTheme(storageKey, defaultTheme) as Theme);
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() =>
    theme === "system" ? getSystemTheme() : theme,
  );

  const applyTheme = useCallback(
    (newTheme: Theme) => {
      let resolved = newTheme;
      if (newTheme === "system" && enableSystem) {
        resolved = getSystemTheme();
      }

      const enable = disableTransitionOnChange ? disableAnimation() : null;
      const d = document.documentElement;

      if (attribute === "class") {
        d.classList.remove("light", "dark");
        d.classList.add(resolved);
      } else {
        d.setAttribute(attribute, resolved);
      }

      if (colorSchemes.has(resolved)) {
        d.style.colorScheme = resolved;
      }

      enable?.();
    },
    [attribute, enableSystem, disableTransitionOnChange],
  );

  const setTheme = useCallback(
    (value: Theme) => {
      setThemeState(value);
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        // Unsupported
      }
    },
    [storageKey],
  );

  const handleMediaQuery = useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemTheme(e);
      setResolvedTheme(resolved);

      if (theme === "system" && enableSystem) {
        applyTheme("system");
      }
    },
    [theme, enableSystem, applyTheme],
  );

  // Listen to system preference changes
  useEffect(() => {
    const media = window.matchMedia(MEDIA);
    media.addEventListener("change", handleMediaQuery);
    handleMediaQuery(media);
    return () => {
      media.removeEventListener("change", handleMediaQuery);
    };
  }, [handleMediaQuery]);

  // Listen to localStorage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) {
        return;
      }
      setThemeState((e.newValue as Theme) || defaultTheme);
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [storageKey, defaultTheme]);

  // Apply theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme: theme === "system" ? resolvedTheme : theme,
      systemTheme: enableSystem
        ? resolvedTheme === "system"
          ? undefined
          : resolvedTheme
        : undefined,
    }),
    [theme, setTheme, resolvedTheme, enableSystem],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <ThemeScript
        attribute={attribute}
        defaultTheme={defaultTheme}
        enableSystem={enableSystem}
        storageKey={storageKey}
      />
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    if (typeof window === "undefined") {
      return {
        theme: "system" as Theme,
        setTheme: () => {},
        resolvedTheme: "light" as Theme,
        systemTheme: "light" as "light" | "dark",
      };
    }
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
