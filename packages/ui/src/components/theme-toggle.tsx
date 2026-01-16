import { useTheme } from "@laxdb/ui/components/theme-provider";
import { Switch } from "@laxdb/ui/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun
        className={`h-4 w-4 transition-colors ${isDark ? "text-muted-foreground" : "text-foreground"}`}
      />
      <Switch
        checked={isDark}
        className="data-[state=checked]:bg-primary"
        onCheckedChange={(checked) => {
          setTheme(checked ? "dark" : "light");
        }}
      />
      <Moon
        className={`h-4 w-4 transition-colors ${isDark ? "text-foreground" : "text-muted-foreground"}`}
      />
    </div>
  );
}
