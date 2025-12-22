import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Switch } from '@/components/ui/switch';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <Sun
        className={`h-4 w-4 transition-colors ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}
      />
      <Switch
        checked={isDark}
        className="data-[state=checked]:bg-primary"
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
      <Moon
        className={`h-4 w-4 transition-colors ${isDark ? 'text-foreground' : 'text-muted-foreground'}`}
      />
    </div>
  );
}
