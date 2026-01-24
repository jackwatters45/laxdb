import { useTheme } from "@laxdb/ui/components/theme-provider";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; icon: typeof RiSunLine; label: string }[] = [
  { value: "light", icon: RiSunLine, label: "Light" },
  { value: "dark", icon: RiMoonLine, label: "Dark" },
  { value: "system", icon: RiComputerLine, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-accent/50 p-0.5">
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
