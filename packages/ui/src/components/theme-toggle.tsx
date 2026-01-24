import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "../lib/utils";
import { useTheme } from "./theme-provider";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-accent/50 p-0.5",
        className,
      )}
    >
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={label}
          className={`relative rounded-sm p-1.5 transition-colors duration-150 ${
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
