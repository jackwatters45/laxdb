import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { listTeams } from "../../lib/club";
import {
  listFixtures,
  listMatchImages,
  type FixtureView,
  type MatchImageView,
} from "../../lib/matches";

export const Route = createFileRoute("/_app/photos")({ component: Photos });

const ALL_TEAMS = "__all";
const MY_TEAMS = "__mine";

const opponentOf = (fixture: FixtureView) =>
  fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;

const gameDate = (fixture: FixtureView) =>
  fixture.scheduledAt === null
    ? "Date TBC"
    : new Date(fixture.scheduledAt).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

const uniqueById = <T extends { readonly id: string }>(items: readonly T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

function Photos() {
  const ctx = Route.useRouteContext();
  const [selectedFilter, setSelectedFilter] = useState(
    ctx.isAdmin ? ALL_TEAMS : MY_TEAMS,
  );
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });
  const teams = teamsQuery.data ?? [];
  const activeMemberId = ctx.me?.activeMemberId ?? null;
  const myTeams = useMemo(
    () =>
      activeMemberId === null
        ? []
        : teams.filter((team) => team.coachMemberId === activeMemberId),
    [activeMemberId, teams],
  );
  const effectiveFilter =
    !ctx.isAdmin && selectedFilter === ALL_TEAMS ? MY_TEAMS : selectedFilter;
  const visibleTeams = useMemo(() => {
    const available = ctx.isAdmin ? teams : myTeams;
    if (effectiveFilter === ALL_TEAMS || effectiveFilter === MY_TEAMS) {
      return [...available].toSorted((a, b) => a.name.localeCompare(b.name));
    }
    return available.filter((team) => team.id === effectiveFilter);
  }, [ctx.isAdmin, effectiveFilter, myTeams, teams]);
  const selectedTeamIds = useMemo(
    () => visibleTeams.map((team) => team.id),
    [visibleTeams],
  );

  const fixturesQuery = useQuery({
    queryKey: ["fixtures", "photos-page", effectiveFilter, selectedTeamIds],
    queryFn: async () => {
      if (effectiveFilter === ALL_TEAMS) return listFixtures({ data: {} });
      return uniqueById(
        (
          await Promise.all(
            selectedTeamIds.map((teamId) => listFixtures({ data: { teamId } })),
          )
        ).flat(),
      );
    },
    enabled:
      effectiveFilter === ALL_TEAMS ||
      (teamsQuery.isSuccess && selectedTeamIds.length > 0),
  });
  const fixtures = fixturesQuery.data ?? [];
  const imagesQuery = useQuery({
    queryKey: ["match-images", "photos-page", effectiveFilter, selectedTeamIds],
    queryFn: async () => {
      if (effectiveFilter === ALL_TEAMS) return listMatchImages({ data: {} });
      return uniqueById(
        (
          await Promise.all(
            selectedTeamIds.map((teamId) =>
              listMatchImages({ data: { teamId } }),
            ),
          )
        ).flat(),
      );
    },
    enabled:
      effectiveFilter === ALL_TEAMS ||
      (teamsQuery.isSuccess && selectedTeamIds.length > 0),
  });
  const imagesByFixture = useMemo(() => {
    const grouped = new Map<string, MatchImageView[]>();
    for (const image of imagesQuery.data ?? []) {
      const fixtureImages = grouped.get(image.fixtureId) ?? [];
      fixtureImages.push(image);
      grouped.set(image.fixtureId, fixtureImages);
    }
    return grouped;
  }, [imagesQuery.data]);
  const error = teamsQuery.error ?? fixturesQuery.error ?? imagesQuery.error;
  const loading =
    teamsQuery.isPending || fixturesQuery.isPending || imagesQuery.isPending;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-semibold">Match photos</h1>
          <p className="text-pretty text-sm text-muted-foreground">
            Browse the club photo archive by team, then by game.
          </p>
        </div>
        {teams.length > 0 && (
          <Select
            items={[
              ...(ctx.isAdmin
                ? [{ value: ALL_TEAMS, label: "All teams" }]
                : []),
              ...(myTeams.length > 0
                ? [{ value: MY_TEAMS, label: "My teams" }]
                : []),
              ...(ctx.isAdmin ? teams : myTeams).map((team) => ({
                value: team.id,
                label: team.name,
              })),
            ]}
            value={effectiveFilter}
            onValueChange={(value) => {
              if (value !== null) setSelectedFilter(value);
            }}
          >
            <SelectTrigger className="min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ctx.isAdmin && (
                <SelectItem value={ALL_TEAMS}>All teams</SelectItem>
              )}
              {myTeams.length > 0 && (
                <SelectItem value={MY_TEAMS}>My teams</SelectItem>
              )}
              {(ctx.isAdmin ? teams : myTeams).map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading photo archive…
        </p>
      ) : visibleTeams.length === 0 ? (
        <Card size="sm">
          <CardContent className="text-sm text-muted-foreground">
            No teams are available. An admin can link squads under Admin.
          </CardContent>
        </Card>
      ) : (
        visibleTeams.map((team) => {
          const teamFixtures = fixtures
            .filter((fixture) => fixture.teamId === team.id)
            .filter(
              (fixture) => (imagesByFixture.get(fixture.id)?.length ?? 0) > 0,
            )
            .toSorted(
              (a, b) =>
                new Date(b.scheduledAt ?? 0).getTime() -
                new Date(a.scheduledAt ?? 0).getTime(),
            );
          const imageCount = teamFixtures.reduce(
            (total, fixture) =>
              total + (imagesByFixture.get(fixture.id)?.length ?? 0),
            0,
          );
          return (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      <Link
                        to="/teams/$teamId"
                        params={{ teamId: team.id }}
                        className="underline-offset-4 hover:underline"
                      >
                        {team.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {imageCount} photo{imageCount === 1 ? "" : "s"} across{" "}
                      {teamFixtures.length} game
                      {teamFixtures.length === 1 ? "" : "s"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Team folder</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {teamFixtures.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No photos have been uploaded for this team yet. Add them
                    from a played fixture.
                  </p>
                ) : (
                  teamFixtures.map((fixture) => {
                    const images = imagesByFixture.get(fixture.id) ?? [];
                    return (
                      <details
                        key={fixture.id}
                        className="group rounded-lg border bg-card"
                      >
                        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 marker:hidden">
                          <div>
                            <div className="font-medium">
                              {fixture.isHome ? "vs" : "at"}{" "}
                              {opponentOf(fixture)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {gameDate(fixture)}
                              {fixture.round === null
                                ? ""
                                : ` · Round ${fixture.round}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">
                              {images.length} photo
                              {images.length === 1 ? "" : "s"}
                            </Badge>
                            <span
                              aria-hidden="true"
                              className="text-muted-foreground group-open:rotate-90"
                            >
                              ›
                            </span>
                          </div>
                        </summary>
                        <div className="border-t p-4">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {images.map((image) => (
                              <a
                                key={image.id}
                                href={`/api/report-images/${image.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-lg border bg-muted/25"
                              >
                                <img
                                  src={`/api/report-images/${image.id}`}
                                  alt={image.fileName}
                                  className="aspect-[4/3] w-full object-cover"
                                  loading="lazy"
                                />
                                <div
                                  className="truncate px-3 py-2 text-xs"
                                  title={image.fileName}
                                >
                                  {image.fileName}
                                </div>
                              </a>
                            ))}
                          </div>
                          <Link
                            to="/teams/$teamId/fixtures/$fixtureId"
                            params={{
                              teamId: fixture.teamId,
                              fixtureId: fixture.id,
                            }}
                            className="mt-4 inline-block text-sm underline underline-offset-2 hover:text-muted-foreground"
                          >
                            Open game report · manage photos
                          </Link>
                        </div>
                      </details>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
