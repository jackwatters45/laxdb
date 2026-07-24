import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Card, CardContent } from "@laxdb/ui/components/ui/card";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo } from "react";

import { TeamPageHeader } from "../../../components/team-page-header";
import {
  listFixtures,
  listMatchImages,
  type FixtureView,
  type MatchImageView,
} from "../../../lib/matches";

export const Route = createFileRoute("/_app/teams/$teamId_/photos")({
  beforeLoad: ({ context, params }) => {
    const team = context.teams.find((entry) => entry.id === params.teamId);
    const canView =
      context.isAdmin ||
      (context.me?.activeMemberId !== null &&
        team?.coachMemberId === context.me?.activeMemberId);
    if (!canView) throw redirect({ to: "/teams" });
  },
  component: TeamPhotosPage,
});

const opponentOf = (fixture: FixtureView) =>
  fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;

const fixtureDate = (fixture: FixtureView) =>
  fixture.scheduledAt === null
    ? "Date TBC"
    : new Date(fixture.scheduledAt).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

function TeamPhotosPage() {
  const { teamId } = Route.useParams();
  const context = Route.useRouteContext();
  const team = context.teams.find((entry) => entry.id === teamId);
  const fixturesQuery = useQuery({
    queryKey: ["fixtures", teamId],
    queryFn: () => listFixtures({ data: { teamId } }),
  });
  const imagesQuery = useQuery({
    queryKey: ["match-images", "team", teamId],
    queryFn: () => listMatchImages({ data: { teamId } }),
  });
  const imagesByFixture = useMemo(() => {
    const grouped = new Map<string, MatchImageView[]>();
    for (const image of imagesQuery.data ?? []) {
      grouped.set(image.fixtureId, [
        ...(grouped.get(image.fixtureId) ?? []),
        image,
      ]);
    }
    return grouped;
  }, [imagesQuery.data]);
  const fixtures = (fixturesQuery.data ?? [])
    .filter((fixture) => (imagesByFixture.get(fixture.id)?.length ?? 0) > 0)
    .toSorted(
      (a, b) =>
        new Date(b.scheduledAt ?? 0).getTime() -
        new Date(a.scheduledAt ?? 0).getTime(),
    );
  const error = fixturesQuery.error ?? imagesQuery.error;

  return (
    <div className="flex flex-col gap-8">
      <TeamPageHeader
        teamId={teamId}
        teamName={team?.name ?? "Team"}
        title="Photos"
        description="Match photos grouped by fixture. Open a game to add or remove images."
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {fixturesQuery.isPending || imagesQuery.isPending ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading photos…
        </p>
      ) : fixtures.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            No match photos yet. Open a completed fixture to upload photos.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {fixtures.map((fixture) => {
            const images = imagesByFixture.get(fixture.id) ?? [];
            return (
              <Card key={fixture.id}>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/fixtures/$fixtureId"
                        params={{ fixtureId: fixture.id }}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {fixture.isHome ? "vs" : "at"} {opponentOf(fixture)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {fixtureDate(fixture)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {images.length} photo{images.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map((image) => (
                      <a
                        key={image.id}
                        href={`/api/report-images/${image.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-lg border"
                      >
                        <img
                          src={`/api/report-images/${image.id}`}
                          alt={image.fileName}
                          className="aspect-[4/3] w-full object-cover"
                          loading="lazy"
                        />
                        <div className="truncate px-3 py-2 text-xs">
                          {image.fileName}
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
