import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  Calendar,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { PageBody, PageContainer } from '@/components/layout/page-content';
import { Badge } from '@/components/ui/badge';
import { BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayersHeader } from './-components/players-header';

// Mock data for players
const mockPlayers = [
  {
    id: '1',
    userId: 'user-1',
    name: 'Alex Johnson',
    jerseyNumber: 23,
    primaryPosition: 'attack',
    secondaryPositions: ['midfield'],
    gradeLevel: 'junior',
    gpa: 3.7,
    height: '6\'0"',
    weight: '175 lbs',
    dominantHand: 'right',

    // Development Info
    recentNotesCount: 5,
    lastNoteDate: new Date('2024-09-20'),
    lastAssessmentDate: new Date('2024-09-15'),
    activeGoalsCount: 3,
    completedResourcesCount: 8,
    pendingResourcesCount: 2,

    // Season Stats
    gamesPlayed: 12,
    goals: 18,
    assists: 12,
    shots: 45,
    shotAccuracy: 62,
    minutesPlayed: 35,

    // Assessment Summary
    overallRating: 7,
    potentialRating: 9,
    improvementAreas: ['Shot Power', 'Defensive Positioning'],
    strengths: ['Field Vision', 'Ball Handling', 'Leadership'],

    // Development Status
    developmentTrend: 'improving' as const,
    priorityLevel: 'high' as const,
    nextMeetingDate: new Date('2024-09-25'),
  },
  {
    id: '2',
    userId: 'user-2',
    name: 'Sarah Martinez',
    jerseyNumber: 1,
    primaryPosition: 'goalie',
    secondaryPositions: [],
    gradeLevel: 'senior',
    gpa: 3.9,
    height: '5\'8"',
    weight: '140 lbs',
    dominantHand: 'left',

    recentNotesCount: 3,
    lastNoteDate: new Date('2024-09-18'),
    lastAssessmentDate: new Date('2024-09-10'),
    activeGoalsCount: 2,
    completedResourcesCount: 12,
    pendingResourcesCount: 1,

    gamesPlayed: 12,
    goals: 0,
    assists: 3,
    saves: 98,
    savePercentage: 78.4,
    minutesPlayed: 48,

    overallRating: 8,
    potentialRating: 8,
    improvementAreas: ['Distribution', 'Clearing Under Pressure'],
    strengths: ['Reaction Time', 'Positioning', 'Communication'],

    developmentTrend: 'stable' as const,
    priorityLevel: 'medium' as const,
    nextMeetingDate: new Date('2024-09-30'),
  },
  {
    id: '3',
    userId: 'user-3',
    name: 'Marcus Davis',
    jerseyNumber: 15,
    primaryPosition: 'defense',
    secondaryPositions: ['lsm'],
    gradeLevel: 'sophomore',
    gpa: 3.2,
    height: '6\'2"',
    weight: '190 lbs',
    dominantHand: 'right',

    recentNotesCount: 7,
    lastNoteDate: new Date('2024-09-22'),
    lastAssessmentDate: new Date('2024-09-05'),
    activeGoalsCount: 4,
    completedResourcesCount: 6,
    pendingResourcesCount: 3,

    gamesPlayed: 11,
    goals: 2,
    assists: 8,
    groundBalls: 28,
    causedTurnovers: 15,
    minutesPlayed: 42,

    overallRating: 6,
    potentialRating: 8,
    improvementAreas: ['Stick Skills', 'Academic Performance', 'Conditioning'],
    strengths: ['Physicality', 'Determination', 'Team Spirit'],

    developmentTrend: 'needs_attention' as const,
    priorityLevel: 'high' as const,
    nextMeetingDate: new Date('2024-09-24'),
  },
  {
    id: '4',
    userId: 'user-4',
    name: 'Tyler Chen',
    jerseyNumber: 8,
    primaryPosition: 'midfield',
    secondaryPositions: ['fogo'],
    gradeLevel: 'freshman',
    gpa: 3.8,
    height: '5\'10"',
    weight: '160 lbs',
    dominantHand: 'right',

    recentNotesCount: 4,
    lastNoteDate: new Date('2024-09-19'),
    lastAssessmentDate: new Date('2024-09-12'),
    activeGoalsCount: 5,
    completedResourcesCount: 4,
    pendingResourcesCount: 4,

    gamesPlayed: 10,
    goals: 8,
    assists: 15,
    faceOffsWon: 45,
    faceOffPercentage: 62.5,
    minutesPlayed: 38,

    overallRating: 7,
    potentialRating: 9,
    improvementAreas: ['Physical Strength', 'Shot Selection'],
    strengths: ['Field Awareness', 'Face-offs', 'Coachability'],

    developmentTrend: 'improving' as const,
    priorityLevel: 'medium' as const,
    nextMeetingDate: new Date('2024-10-01'),
  },
];

// Server function for getting team players
const getTeamPlayers = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { PlayerDevelopmentAPI } = await import('@laxdb/core/player-development/index');
  // const request = getRequest();
  // return await PlayerDevelopmentAPI.getTeamPlayers(teamId, request.headers);

  return mockPlayers;
});

// Server function for permissions
const getPlayerPermissions = createServerFn().handler(async () => ({
  canViewAllPlayers: true,
  canCreateNotes: true,
  canAssess: true,
  canAssignResources: true,
  canSetGoals: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/players/dashboard'
)({
  component: PlayersPage,
  loader: async () => {
    const [players, permissions] = await Promise.all([
      getTeamPlayers(),
      getPlayerPermissions(),
    ]);

    return { players, permissions };
  },
});

function PlayersPage() {
  const { organizationSlug } = Route.useParams();
  const { players, permissions } = Route.useLoaderData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTrend, setSelectedTrend] = useState<string>('all');

  // Get unique values for filters
  const positions = Array.from(new Set(players.map((p) => p.primaryPosition)));
  const grades = Array.from(new Set(players.map((p) => p.gradeLevel)));

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.jerseyNumber.toString().includes(searchTerm) ||
      player.primaryPosition.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPosition =
      selectedPosition === 'all' || player.primaryPosition === selectedPosition;
    const matchesGrade =
      selectedGrade === 'all' || player.gradeLevel === selectedGrade;
    const matchesTrend =
      selectedTrend === 'all' || player.developmentTrend === selectedTrend;

    return matchesSearch && matchesPosition && matchesGrade && matchesTrend;
  });

  // Calculate team statistics
  const teamStats = {
    totalPlayers: players.length,
    averageGPA:
      players.reduce((sum, p) => sum + (p.gpa || 0), 0) / players.length,
    needingAttention: players.filter(
      (p) => p.developmentTrend === 'needs_attention'
    ).length,
    highPotential: players.filter((p) => p.potentialRating >= 8).length,
  };

  return (
    <>
      <Header />

      <PageBody>
        <PageContainer>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">Player Development</h1>
              <p className="text-muted-foreground">
                Track individual player progress and development
              </p>
            </div>

            <div className="flex gap-2">
              {permissions.canCreateNotes && (
                <Button asChild variant="outline">
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/players/notes/create"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Add Note
                  </Link>
                </Button>
              )}
              {permissions.canAssess && (
                <Button asChild>
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/players/assessments/create"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Assessment
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Team Overview Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Players
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {teamStats.totalPlayers}
                </div>
                <p className="text-muted-foreground text-xs">
                  Active roster members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Team GPA</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {teamStats.averageGPA.toFixed(2)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Average academic performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Need Attention
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {teamStats.needingAttention}
                </div>
                <p className="text-muted-foreground text-xs">
                  Players requiring focus
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  High Potential
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {teamStats.highPotential}
                </div>
                <p className="text-muted-foreground text-xs">
                  Players with 8+ potential
                </p>
              </CardContent>
            </Card>
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
                    placeholder="Search players by name, position, or number..."
                    type="text"
                    value={searchTerm}
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    className="rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    value={selectedPosition}
                  >
                    <option value="all">All Positions</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    value={selectedGrade}
                  >
                    <option value="all">All Grades</option>
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade.charAt(0).toUpperCase() + grade.slice(1)}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => setSelectedTrend(e.target.value)}
                    value={selectedTrend}
                  >
                    <option value="all">All Trends</option>
                    <option value="improving">Improving</option>
                    <option value="stable">Stable</option>
                    <option value="needs_attention">Needs Attention</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Grid */}
          {filteredPlayers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  permissions={permissions}
                  player={player}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 font-semibold text-xl">No players found</h2>
              <p className="mb-6 text-muted-foreground">
                {searchTerm ||
                selectedPosition !== 'all' ||
                selectedGrade !== 'all' ||
                selectedTrend !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Players will appear here when added to the team'}
              </p>
            </div>
          )}
        </PageContainer>
      </PageBody>
    </>
  );
}

type Player = (typeof mockPlayers)[0];
type Permissions = {
  canViewAllPlayers: boolean;
  canCreateNotes: boolean;
  canAssess: boolean;
  canAssignResources: boolean;
  canSetGoals: boolean;
};

function PlayerCard({
  player,
  permissions,
}: {
  player: Player;
  permissions: Permissions;
}) {
  const { organizationSlug } = Route.useParams();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'default';
      case 'stable':
        return 'secondary';
      case 'needs_attention':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'Improving';
      case 'stable':
        return 'Stable';
      case 'needs_attention':
        return 'Needs Attention';
      default:
        return trend;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPositionIcon = (_position: string) => {
    // You could add position-specific icons here
    return <Users className="h-4 w-4" />;
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {player.jerseyNumber}
            </div>
            <div>
              <CardTitle className="text-lg">{player.name}</CardTitle>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                {getPositionIcon(player.primaryPosition)}
                <span>
                  {player.primaryPosition.charAt(0).toUpperCase() +
                    player.primaryPosition.slice(1)}
                </span>
                <span>•</span>
                <span>
                  {player.gradeLevel.charAt(0).toUpperCase() +
                    player.gradeLevel.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Badge variant={getTrendColor(player.developmentTrend)}>
              {getTrendLabel(player.developmentTrend)}
            </Badge>
            <Badge variant={getPriorityColor(player.priorityLevel)}>
              {player.priorityLevel.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Player Stats Summary */}
        <div className="grid grid-cols-3 gap-3 rounded bg-muted p-3 text-center">
          <div>
            <div className="font-bold text-lg">{player.overallRating}/10</div>
            <div className="text-muted-foreground text-xs">Current</div>
          </div>
          <div>
            <div className="font-bold text-lg">{player.potentialRating}/10</div>
            <div className="text-muted-foreground text-xs">Potential</div>
          </div>
          <div>
            <div className="font-bold text-lg">
              {player.gpa?.toFixed(1) || 'N/A'}
            </div>
            <div className="text-muted-foreground text-xs">GPA</div>
          </div>
        </div>

        {/* Development Activity */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Recent Notes:</span>
            <span className="font-medium">{player.recentNotesCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Active Goals:</span>
            <span className="font-medium">{player.activeGoalsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Pending Resources:</span>
            <span className="font-medium">{player.pendingResourcesCount}</span>
          </div>
        </div>

        {/* Key Areas */}
        <div className="space-y-2">
          <div>
            <div className="mb-1 font-medium text-green-700 text-sm">
              Strengths
            </div>
            <div className="text-xs">
              {player.strengths.slice(0, 2).join(', ')}
            </div>
          </div>
          <div>
            <div className="mb-1 font-medium text-red-700 text-sm">
              Focus Areas
            </div>
            <div className="text-xs">
              {player.improvementAreas.slice(0, 2).join(', ')}
            </div>
          </div>
        </div>

        {/* Next Meeting */}
        {player.nextMeetingDate && (
          <div className="flex items-center gap-2 rounded bg-blue-50 p-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Next meeting: {formatDate(player.nextMeetingDate)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1" size="sm" variant="outline">
            <Link
              params={{
                organizationSlug,
                playerId: player.id,
              }}
              to="/$organizationSlug/players/$playerId"
            >
              View Profile
            </Link>
          </Button>

          {permissions.canCreateNotes && (
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug }}
                search={{ playerId: player.id }}
                to="/$organizationSlug/players/notes/create"
              >
                <FileText className="mr-1 h-3 w-3" />
                Note
              </Link>
            </Button>
          )}

          {permissions.canAssess && (
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug }}
                search={{ playerId: player.id }}
                to="/$organizationSlug/players/assessments/create"
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                Assess
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <PlayersHeader organizationSlug={organizationSlug}>
      <BreadcrumbItem>
        <BreadcrumbLink asChild className="max-w-full truncate" title="Players">
          <Link params={{ organizationSlug }} to="/$organizationSlug/players">
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayersHeader>
  );
}
