import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageBody } from "@/components/layout/page-content";
import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { GamesHeader } from "./-components/games-header";

// Mock data for now - will replace with actual API calls
const mockGames = [
  {
    id: "1",
    opponentName: "Riverside Hawks",
    gameDate: new Date("2024-09-25T15:00:00"),
    venue: "Memorial Stadium",
    isHomeGame: true,
    gameType: "regular" as const,
    status: "scheduled" as const,
    homeScore: 0,
    awayScore: 0,
  },
  {
    id: "2",
    opponentName: "Central Valley Eagles",
    gameDate: new Date("2024-09-18T18:30:00"),
    venue: "Eagle Field",
    isHomeGame: false,
    gameType: "regular" as const,
    status: "completed" as const,
    homeScore: 8,
    awayScore: 12,
  },
  {
    id: "3",
    opponentName: "North County Titans",
    gameDate: new Date("2024-10-02T16:00:00"),
    venue: "Lions Field",
    isHomeGame: true,
    gameType: "playoff" as const,
    status: "scheduled" as const,
    homeScore: 0,
    awayScore: 0,
  },
];

// Server function for getting games (will implement proper API later)
const getTeamGames = createServerFn().handler(() => {
  // FIX: Replace with actual API call
  // const { GamesAPI } = await import('@laxdb/core/games/index');
  // const request = getRequest();
  // return await GamesAPI.getTeamGames(teamId, request.headers);

  return mockGames;
});

// Server function for getting user permissions (simplified for now)
const getUserPermissions = createServerFn().handler(() => {
  // FIX: Replace with actual permission check
  return {
    canManageGames: true, // Will check user role
    canEditGames: true,
    canViewStats: true,
  };
});

export const Route = createFileRoute("/_protected/$organizationSlug/games/")({
  component: GamesPage,
  loader: async () => {
    try {
      const [games, permissions] = await Promise.all([
        getTeamGames(),
        getUserPermissions(),
      ]);

      return { games, permissions };
    } catch {
      return {
        games: mockGames,
        permissions: {
          canManageGames: true,
          canEditGames: true,
          canViewStats: true,
        },
      };
    }
  },
});

function GamesPage() {
  const { organizationSlug: _organizationSlug } = Route.useParams();
  const { games: _games, permissions: _permissions } = Route.useLoaderData();

  return (
    <>
      <Header />
      <PageBody className="py-4">Meep</PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <GamesHeader organizationSlug={organizationSlug}>
      <BreadcrumbItem>
        <BreadcrumbLink asChild className="max-w-full truncate" title="Games">
          <Link params={{ organizationSlug }} to="/$organizationSlug/games">
            Games
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </GamesHeader>
  );
}
