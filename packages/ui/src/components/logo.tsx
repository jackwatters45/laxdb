import { cn } from "../lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("size-6", className)}>
      <circle cx="50" cy="50" r="45" fill="white" />
    </svg>
  );
}
