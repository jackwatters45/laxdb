import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { LeagueFilter } from "./-components/league-filter";
import { Pagination } from "./-components/pagination";
import { StatsTable } from "./-components/stats-table";

// --- URL State Schema ---
const SortColumn = Schema.Literal("points", "goals", "assists");
const SortOrder = Schema.Literal("asc", "desc");

const statsSearchSchema = Schema.standardSchemaV1(
  Schema.Struct({
    leagues: Schema.optional(Schema.String), // Comma-separated, parsed to array
    sort: Schema.optional(SortColumn),
    order: Schema.optional(SortOrder),
    after: Schema.optional(Schema.String), // Cursor for pagination
  }),
);

// Defaults
const DEFAULT_LEAGUES = "PLL,NLL";
const DEFAULT_SORT = "points" as const;
const DEFAULT_ORDER = "desc" as const;
const DEFAULT_LIMIT = 50;

// API URL from environment (or fallback for dev)
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

// --- Types ---
interface LeaderboardEntry {
  statId: number;
  rank: number;
  playerId: number;
  playerName: string;
  position: string | null;
  teamName: string | null;
  teamAbbreviation: string | null;
  leagueAbbreviation: string;
  goals: number;
  assists: number;
  points: number;
  gamesPlayed: number;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  nextCursor: string | null;
}

// API response shape from the backend
interface ApiLeaderboardResponse {
  data: LeaderboardEntry[];
  nextCursor: string | null;
}

// --- API Client ---
async function fetchLeaderboard(params: {
  leagues: string[];
  sort: "points" | "goals" | "assists";
  limit: number;
  cursor?: string;
}): Promise<LeaderboardResponse> {
  const body = {
    leagues: params.leagues as Array<"PLL" | "NLL" | "MLL" | "MSL" | "WLA">,
    sort: params.sort,
    limit: params.limit,
    ...(params.cursor ? { cursor: params.cursor } : {}),
  };

  const response = await fetch(`${API_URL}/api/stats/leaderboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }
  // API returns LeaderboardResponse with data and nextCursor
  const result: ApiLeaderboardResponse = await response.json();
  return {
    entries: result.data,
    nextCursor: result.nextCursor,
  };
}

// --- Query Options ---
function leaderboardQueryOptions(params: {
  leagues: string[];
  sort: "points" | "goals" | "assists";
  order: "asc" | "desc";
  cursor: string | undefined;
}) {
  return queryOptions({
    queryKey: ["leaderboard", params.leagues, params.sort, params.order, params.cursor ?? ""],
    queryFn: () =>
      fetchLeaderboard({
        leagues: params.leagues,
        sort: params.sort,
        limit: DEFAULT_LIMIT,
        ...(params.cursor ? { cursor: params.cursor } : {}),
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// --- Route Definition ---
export const Route = createFileRoute("/stats/")({
  validateSearch: statsSearchSchema,
  component: StatsPage,
  loaderDeps: ({ search }) => ({
    leagues: search.leagues ?? DEFAULT_LEAGUES,
    sort: search.sort ?? DEFAULT_SORT,
    order: search.order ?? DEFAULT_ORDER,
    after: search.after,
  }),
  loader: async ({ context, deps }) => {
    const leagues = deps.leagues.split(",");

    await context.queryClient.ensureQueryData(
      leaderboardQueryOptions({
        leagues,
        sort: deps.sort,
        order: deps.order,
        cursor: deps.after,
      }),
    );
  },
});

// --- Page Component ---
function StatsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/stats/" });

  // Parse search params with defaults
  const leagues = (search.leagues ?? DEFAULT_LEAGUES).split(",");
  const sort = search.sort ?? DEFAULT_SORT;
  const order = search.order ?? DEFAULT_ORDER;

  const { data } = useSuspenseQuery(
    leaderboardQueryOptions({
      leagues,
      sort,
      order,
      cursor: search.after,
    }),
  );

  // Navigation helpers
  const updateSearch = (updates: Partial<typeof search>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
        // Reset cursor when filters change
        after:
          updates.leagues !== undefined || updates.sort !== undefined ? undefined : updates.after,
      }),
    });
  };

  const handleLeagueChange = (selectedLeagues: string[]) => {
    updateSearch({ leagues: selectedLeagues.join(",") });
  };

  const handleSort = (column: "points" | "goals" | "assists") => {
    if (sort === column) {
      // Toggle order
      updateSearch({ order: order === "asc" ? "desc" : "asc" });
    } else {
      // New column, default to desc
      updateSearch({ sort: column, order: "desc" });
    }
  };

  const handleNextPage = () => {
    if (data.nextCursor) {
      updateSearch({ after: data.nextCursor });
    }
  };

  const handlePrevPage = () => {
    // For simplicity, just go back to start (no prev cursor tracking in MVP)
    updateSearch({ after: undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold">
            LaxDB
          </Link>
          <nav className="flex gap-4">
            <span className="font-medium text-primary">Stats</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Lacrosse Stats</h1>
          <p className="mt-2 text-muted-foreground">
            Player statistics across PLL, NLL, MLL, MSL, and WLA leagues.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <LeagueFilter selectedLeagues={leagues} onChange={handleLeagueChange} />
        </div>

        {/* Stats Table */}
        <StatsTable data={data.entries} sort={sort} order={order} onSort={handleSort} />

        {/* Pagination */}
        <Pagination
          hasMore={data.nextCursor !== null}
          hasPrev={search.after !== undefined}
          onNext={handleNextPage}
          onPrev={handlePrevPage}
        />
      </main>
    </div>
  );
}
