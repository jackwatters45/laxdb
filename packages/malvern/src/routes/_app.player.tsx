import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/player")({
  component: PlayerComingSoon,
});

function PlayerComingSoon() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player access is coming soon</CardTitle>
        <CardDescription>
          You’re signed in, but the player dashboard is not ready yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          For now, Malvern is using this app for admins and coaches to manage
          squads, fixtures, reports, and team setup.
        </p>
        <p>
          Player features will appear here once they’re ready. You don’t need to
          do anything else.
        </p>
      </CardContent>
    </Card>
  );
}
