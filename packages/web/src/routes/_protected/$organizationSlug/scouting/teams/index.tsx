import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  Calendar,
  FileText,
  MapPin,
  Plus,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for opposing teams
const mockOpposingTeams = [
  {
    id: '1',
    name: 'Riverside Hawks',
    leagueName: 'Metro Lacrosse League',
    division: 'Division A',
    coachName: 'Mike Thompson',
    homeField: 'Riverside Sports Complex',
    teamColors: 'Blue and Gold',
    wins: 8,
    losses: 3,
    ties: 1,
    goalsFor: 156,
    goalsAgainst: 98,
    reportsCount: 3,
    lastScoutedDate: new Date('2024-09-18'),
    nextGameDate: new Date('2024-09-25T15:00:00'),
    strengths: ['Fast Break', 'Strong Defense', 'Experienced Goalie'],
    weaknesses: ['Poor Face-offs', 'Weak on Left Side'],
    keyPlayers: ['#23 Johnson (Attack)', '#1 Smith (Goalie)'],
    typicalStyle: 'aggressive',
  },
  {
    id: '2',
    name: 'Central Valley Eagles',
    leagueName: 'Metro Lacrosse League',
    division: 'Division A',
    coachName: 'Sarah Wilson',
    homeField: 'Eagle Field',
    teamColors: 'Red and White',
    wins: 6,
    losses: 5,
    ties: 0,
    goalsFor: 134,
    goalsAgainst: 125,
    reportsCount: 2,
    lastScoutedDate: new Date('2024-09-20'),
    nextGameDate: new Date('2024-10-15T14:00:00'),
    strengths: ['Possession Game', 'Disciplined'],
    weaknesses: ['Slow Transitions', 'Limited Depth'],
    keyPlayers: ['#15 Davis (Midfield)', '#7 Brown (Defense)'],
    typicalStyle: 'possession',
  },
  {
    id: '3',
    name: 'North County Titans',
    leagueName: 'Metro Lacrosse League',
    division: 'Division A',
    coachName: 'John Martinez',
    homeField: 'Titan Stadium',
    teamColors: 'Green and Black',
    wins: 9,
    losses: 2,
    ties: 0,
    goalsFor: 178,
    goalsAgainst: 89,
    reportsCount: 2,
    lastScoutedDate: new Date('2024-09-15'),
    nextGameDate: new Date('2024-10-02T16:00:00'),
    strengths: ['High-Powered Offense', 'Athletic Team'],
    weaknesses: ['Prone to Penalties', 'Young Defense'],
    keyPlayers: ['#10 Rodriguez (Attack)', '#22 Lee (Midfield)'],
    typicalStyle: 'fast_break',
  },
  {
    id: '4',
    name: 'Valley Storm',
    leagueName: 'Metro Lacrosse League',
    division: 'Division B',
    coachName: 'Chris Anderson',
    homeField: 'Storm Field',
    teamColors: 'Purple and Silver',
    wins: 4,
    losses: 7,
    ties: 0,
    goalsFor: 98,
    goalsAgainst: 142,
    reportsCount: 0,
    lastScoutedDate: null,
    nextGameDate: new Date('2024-10-08T14:00:00'),
    strengths: ['Determined', 'Good Teamwork'],
    weaknesses: ['Limited Talent', 'Inconsistent'],
    keyPlayers: ['#8 Wilson (Attack)'],
    typicalStyle: 'defensive',
  },
];

// Server function for getting opposing teams
const getOpposingTeams = createServerFn().handler(() => {
  // TODO: Replace with actual API call
  // const { ScoutingAPI } = await import('@laxdb/core/scouting/index');
  // const request = getRequest();
  // return await ScoutingAPI.getOpposingTeams(request.headers);

  return mockOpposingTeams;
});

// Server function for permissions
const getScoutingPermissions = createServerFn().handler(async () => ({
  canCreateTeams: true,
  canCreateReports: true,
  canEditTeams: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/scouting/teams/'
)({
  component: OpposingTeamsPage,
  loader: async () => {
    const [teams, permissions] = await Promise.all([
      getOpposingTeams(),
      getScoutingPermissions(),
    ]);

    return { teams, permissions };
  },
});

function OpposingTeamsPage() {
  const { organizationSlug } = Route.useParams();
  const { teams, permissions } = Route.useLoaderData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');

  // Get unique leagues and divisions for filtering
  const leagues = Array.from(
    new Set(teams.map((team) => team.leagueName).filter(Boolean))
  );
  const divisions = Array.from(
    new Set(teams.map((team) => team.division).filter(Boolean))
  );

  // Filter teams based on search and filters
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.coachName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leagueName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDivision =
      selectedDivision === 'all' || team.division === selectedDivision;
    const matchesLeague =
      selectedLeague === 'all' || team.leagueName === selectedLeague;

    return matchesSearch && matchesDivision && matchesLeague;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Opposing Teams</h1>
          <p className="text-muted-foreground">
            Manage and scout opposing teams in your league
          </p>
        </div>

        {permissions.canCreateTeams && (
          <Button asChild>
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/scouting/teams/create"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border border-input py-2 pr-3 pl-10 focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teams, coaches, or leagues..."
                type="text"
                value={searchTerm}
              />
            </div>

            <div className="flex gap-2">
              <select
                className="rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => setSelectedLeague(e.target.value)}
                value={selectedLeague}
              >
                <option value="all">All Leagues</option>
                {leagues.map((league) => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => setSelectedDivision(e.target.value)}
                value={selectedDivision}
              >
                <option value="all">All Divisions</option>
                {divisions.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              organizationSlug={organizationSlug}
              permissions={permissions}
              team={team}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">No teams found</h2>
          <p className="mb-6 text-muted-foreground">
            {searchTerm ||
            selectedLeague !== 'all' ||
            selectedDivision !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first opposing team'}
          </p>
          {permissions.canCreateTeams && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/scouting/teams/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Team
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

type OpposingTeam = (typeof mockOpposingTeams)[0];
type Permissions = {
  canCreateTeams: boolean;
  canCreateReports: boolean;
  canEditTeams: boolean;
};

function TeamCard({
  team,
  permissions,
  organizationSlug,
}: {
  team: OpposingTeam;
  permissions: Permissions;
  organizationSlug: string;
}) {
  const formatDate = (date: Date | null) => {
    if (!date) {
      return 'Never';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getWinPercentage = (wins: number, losses: number, ties: number) => {
    const total = wins + losses + ties;
    if (total === 0) {
      return 0;
    }
    return Math.round(((wins + ties * 0.5) / total) * 100);
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'aggressive':
        return 'destructive';
      case 'fast_break':
        return 'default';
      case 'possession':
        return 'secondary';
      case 'defensive':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStyleLabel = (style: string) => {
    switch (style) {
      case 'aggressive':
        return 'Aggressive';
      case 'fast_break':
        return 'Fast Break';
      case 'possession':
        return 'Possession';
      case 'defensive':
        return 'Defensive';
      default:
        return style;
    }
  };

  const winPercentage = getWinPercentage(team.wins, team.losses, team.ties);
  const isUpcoming =
    team.nextGameDate && new Date(team.nextGameDate) > new Date();
  const needsScout = team.reportsCount === 0 || !team.lastScoutedDate;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{team.name}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {team.leagueName} • {team.division}
            </p>
          </div>
          <div className="flex gap-1">
            <Badge variant={getStyleColor(team.typicalStyle)}>
              {getStyleLabel(team.typicalStyle)}
            </Badge>
            {needsScout && <Badge variant="destructive">Need Scout</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Team Record */}
        <div className="flex items-center justify-between rounded bg-muted p-3">
          <div className="text-center">
            <div className="font-bold text-lg">
              {team.wins}-{team.losses}-{team.ties}
            </div>
            <div className="text-muted-foreground text-xs">Record</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 font-bold text-lg">
              {winPercentage}%
              {winPercentage >= 60 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="text-muted-foreground text-xs">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">
              {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}
              {team.goalsFor - team.goalsAgainst}
            </div>
            <div className="text-muted-foreground text-xs">Goal Diff</div>
          </div>
        </div>

        {/* Team Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Coach: {team.coachName || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{team.homeField || 'Unknown venue'}</span>
          </div>
          {isUpcoming && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Next game: {formatDate(team.nextGameDate)}</span>
            </div>
          )}
        </div>

        {/* Scouting Info */}
        <div className="rounded border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-sm">Scouting Status</span>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span className="text-xs">{team.reportsCount} reports</span>
            </div>
          </div>
          <div className="text-muted-foreground text-xs">
            Last scouted: {formatDate(team.lastScoutedDate)}
          </div>
        </div>

        {/* Quick Strengths/Weaknesses */}
        <div className="space-y-2">
          <div>
            <div className="mb-1 font-medium text-green-700 text-sm">
              Strengths
            </div>
            <div className="text-xs">
              {team.strengths.slice(0, 2).join(', ')}
            </div>
          </div>
          <div>
            <div className="mb-1 font-medium text-red-700 text-sm">
              Weaknesses
            </div>
            <div className="text-xs">
              {team.weaknesses.slice(0, 2).join(', ')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1" size="sm" variant="outline">
            <Link
              params={{
                organizationSlug,
                teamId: team.id,
              }}
              to="/$organizationSlug/scouting/teams/$teamId"
            >
              View Details
            </Link>
          </Button>

          {permissions.canCreateReports && (
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/scouting/teams/create"
              >
                <FileText className="mr-1 h-3 w-3" />
                Scout
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
