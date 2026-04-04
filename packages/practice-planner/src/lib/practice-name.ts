/**
 * Derives a display name for a practice from its metadata.
 *
 * Priority: date → location → generic fallback.
 */
export function practiceName(practice: {
  date: string | Date | null;
  location?: string | null;
}): string {
  if (practice.date) {
    const d =
      practice.date instanceof Date
        ? practice.date
        : new Date(practice.date + "T00:00:00"); // avoid timezone shift
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return practice.location
      ? `${formatted} — ${practice.location}`
      : `${formatted} Practice`;
  }

  if (practice.location) {
    return `Practice @ ${practice.location}`;
  }

  return "Untitled Practice";
}
