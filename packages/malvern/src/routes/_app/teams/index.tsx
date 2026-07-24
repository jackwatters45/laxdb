import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";

import type { TeamView } from "../../../lib/club";

export const Route = createFileRoute("/_app/teams/")({
  component: TeamsIndex,
});

function TeamGrid({
  teams,
  description,
}: {
  teams: readonly TeamView[];
  description: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {teams.map((team) => (
        <Link
          key={team.id}
          to="/teams/$teamId"
          params={{ teamId: team.id }}
          className="group block"
        >
          <Card className="h-full group-hover:border-foreground/35">
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm font-medium underline underline-offset-4">
                Open team →
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function TeamsIndex() {
  const ctx = Route.useRouteContext();
  const activeMemberId = ctx.me?.activeMemberId ?? null;
  const myTeams = ctx.teams.filter(
    (team) => team.coachMemberId === activeMemberId,
  );
  const otherTeams = ctx.teams.filter(
    (team) => team.coachMemberId !== activeMemberId,
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-1">
        <h1 className="text-balance text-2xl font-semibold">Teams</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Open a squad to see its fixtures, reports, photos, and roster.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-balance text-xl font-semibold">My teams</h2>
          <p className="text-pretty text-sm text-muted-foreground">
            The squads you coach.
          </p>
        </div>
        {myTeams.length === 0 ? (
          <Card size="sm">
            <CardContent className="text-sm text-muted-foreground">
              You are not assigned to a team yet. An admin can assign you under
              Admin → Coaches.
            </CardContent>
          </Card>
        ) : (
          <TeamGrid teams={myTeams} description="Your team" />
        )}
      </section>

      {ctx.isAdmin && otherTeams.length > 0 && (
        <section className="space-y-4 border-t pt-8">
          <div>
            <h2 className="text-balance text-xl font-semibold">
              Other club teams
            </h2>
            <p className="text-pretty text-sm text-muted-foreground">
              Every other squad you can manage as an admin.
            </p>
          </div>
          <TeamGrid teams={otherTeams} description="Club team" />
        </section>
      )}
    </div>
  );
}
