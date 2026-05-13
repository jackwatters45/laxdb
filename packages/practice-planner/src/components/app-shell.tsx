import { cn } from "@laxdb/ui/lib/utils";
import { Link, useMatches } from "@tanstack/react-router";
import { ClipboardList, Dumbbell, BookOpen, Settings } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Practices", icon: ClipboardList },
  { to: "/drills", label: "Drills", icon: Dumbbell },
  { to: "/playbook", label: "Playbook", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname ?? "/";

  // The practice editor ($id) has its own full-screen chrome — skip the shell
  const isPracticeEditor = matches.some((m) => m.routeId === "/practice/$id");
  if (isPracticeEditor) return children;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 flex items-center h-12 px-4 border-b border-border bg-card">
        <Link to="/" className="mr-6 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground tracking-tight">
            LaxDB
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === "/"
                ? currentPath === "/" || currentPath.startsWith("/practice")
                : currentPath.startsWith(to);

            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-1.5 rounded-md p-1.5 transition-colors",
            currentPath === "/settings"
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          )}
        >
          <Settings size={14} />
          <span className="sr-only">Settings</span>
        </Link>
      </header>

      {children}
    </div>
  );
}
