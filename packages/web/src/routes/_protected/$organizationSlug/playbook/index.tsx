import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Layers,
  Play,
  Plus,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for playbook dashboard
const mockPlaybookData = {
  stats: {
    totalPlays: 24,
    totalCategories: 5,
    favoritePlayCount: 8,
    averageSuccessRate: 73.2,
    playsUsedThisWeek: 12,
    practiceSessionsThisWeek: 3,
  },
  recentPlays: [
    {
      id: '1',
      name: 'Quick Strike',
      category: 'Offensive',
      categoryColor: '#10b981',
      playType: 'offensive',
      lastUsed: new Date('2024-09-22'),
      successRate: 85,
      timesUsed: 15,
      isFavorite: true,
      difficultyLevel: 'intermediate',
    },
    {
      id: '2',
      name: 'Zone Press',
      category: 'Defensive',
      categoryColor: '#ef4444',
      playType: 'defensive',
      lastUsed: new Date('2024-09-20'),
      successRate: 67,
      timesUsed: 8,
      isFavorite: false,
      difficultyLevel: 'advanced',
    },
    {
      id: '3',
      name: 'Man Up Motion',
      category: 'Special Situations',
      categoryColor: '#f59e0b',
      playType: 'special_situations',
      lastUsed: new Date('2024-09-18'),
      successRate: 78,
      timesUsed: 12,
      isFavorite: true,
      difficultyLevel: 'intermediate',
    },
  ],
  recentPracticeSessions: [
    {
      id: '1',
      playName: 'Quick Strike',
      practiceDate: new Date('2024-09-23'),
      duration: 25,
      playersPresent: 15,
      executionRating: 8,
      successfulReps: 18,
      totalReps: 22,
    },
    {
      id: '2',
      playName: 'Transition Clear',
      practiceDate: new Date('2024-09-21'),
      duration: 30,
      playersPresent: 16,
      executionRating: 7,
      successfulReps: 14,
      totalReps: 20,
    },
    {
      id: '3',
      playName: 'Face-off Wing',
      practiceDate: new Date('2024-09-19'),
      duration: 20,
      playersPresent: 12,
      executionRating: 9,
      successfulReps: 16,
      totalReps: 18,
    },
  ],
  playerAssignments: [
    {
      playerId: '1',
      playerName: 'Alex Johnson',
      assignedPlays: 8,
      masteredPlays: 5,
      inProgressPlays: 3,
      priorityLevel: 'high',
    },
    {
      playerId: '2',
      playerName: 'Sarah Martinez',
      assignedPlays: 6,
      masteredPlays: 6,
      inProgressPlays: 0,
      priorityLevel: 'low',
    },
    {
      playerId: '3',
      playerName: 'Marcus Davis',
      assignedPlays: 12,
      masteredPlays: 7,
      inProgressPlays: 5,
      priorityLevel: 'medium',
    },
  ],
  upcomingEvents: [
    {
      type: 'practice',
      title: 'Man-Up Situations Practice',
      date: new Date('2024-09-25'),
      plays: ['Man Up Motion', 'Power Play Set'],
    },
    {
      type: 'game',
      title: 'vs. Central Valley Eagles',
      date: new Date('2024-09-28'),
      plays: ['Quick Strike', 'Zone Press', 'Clear Pattern'],
    },
  ],
  playCategories: [
    { name: 'Offensive', count: 8, color: '#10b981' },
    { name: 'Defensive', count: 6, color: '#ef4444' },
    { name: 'Special Situations', count: 4, color: '#f59e0b' },
    { name: 'Transition', count: 4, color: '#3b82f6' },
    { name: 'Set Pieces', count: 2, color: '#8b5cf6' },
  ],
};

// Server function for getting playbook data
const getPlaybookDashboard = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { PlaybookAPI } = await import('@laxdb/core/playbook/index');
  // const request = getRequest();
  // return await PlaybookAPI.getPlaybookDashboard(teamId, request.headers);

  return mockPlaybookData;
});

// Server function for permissions
const getPlaybookPermissions = createServerFn().handler(async () => ({
  canCreatePlays: true,
  canEditPlays: true,
  canAssignPlays: true,
  canViewAnalytics: true,
  canManageCategories: true,
}));

export const Route = createFileRoute('/_protected/$organizationSlug/playbook/')(
  {
    component: PlaybookDashboard,
    loader: async () => {
      const [data, permissions] = await Promise.all([
        getPlaybookDashboard(),
        getPlaybookPermissions(),
      ]);

      return { data, permissions };
    },
  }
);

function PlaybookDashboard() {
  const { organizationSlug } = Route.useParams();
  const { data, permissions } = Route.useLoaderData();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'secondary';
      case 'intermediate':
        return 'default';
      case 'advanced':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPlayTypeIcon = (type: string) => {
    switch (type) {
      case 'offensive':
        return <Zap className="h-4 w-4" />;
      case 'defensive':
        return <Target className="h-4 w-4" />;
      case 'special_situations':
        return <Star className="h-4 w-4" />;
      case 'transition':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
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

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Playbook</h1>
          <p className="text-muted-foreground">
            Manage your team's plays and strategic knowledge
          </p>
        </div>

        <div className="flex gap-2">
          {permissions.canManageCategories && (
            <Button asChild variant="outline">
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/playbook/categories"
              >
                <Layers className="mr-2 h-4 w-4" />
                Categories
              </Link>
            </Button>
          )}
          {permissions.canCreatePlays && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/playbook/plays/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Play
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Plays</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{data.stats.totalPlays}</div>
            <p className="text-muted-foreground text-xs">
              Across {data.stats.totalCategories} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.stats.averageSuccessRate}%
            </div>
            <p className="text-muted-foreground text-xs">
              Average across all plays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Used This Week
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.stats.playsUsedThisWeek}
            </div>
            <p className="text-muted-foreground text-xs">
              In games and practice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Practice Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.stats.practiceSessionsThisWeek}
            </div>
            <p className="text-muted-foreground text-xs">This week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Play Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recently Used Plays */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recently Used Plays</CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link
                    params={{ organizationSlug }}
                    search={{
                      search: '',
                      category: 'All',
                      difficulty: 'All',
                      favorites: false,
                    }}
                    to="/$organizationSlug/playbook/plays"
                  >
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentPlays.map((play) => (
                  <div
                    className="flex items-center justify-between rounded border p-3"
                    key={play.id}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: play.categoryColor }}
                      >
                        {getPlayTypeIcon(play.playType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{play.name}</span>
                          {play.isFavorite && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {play.category} • Last used{' '}
                          {formatDate(play.lastUsed)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {play.successRate}%
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Success
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {play.timesUsed}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Uses
                        </div>
                      </div>
                      <Badge variant={getDifficultyColor(play.difficultyLevel)}>
                        {play.difficultyLevel}
                      </Badge>
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          params={{ organizationSlug, playId: play.id }}
                          to="/$organizationSlug/playbook/plays/$playId"
                        >
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Practice Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Practice Sessions</CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/playbook/practice"
                  >
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentPracticeSessions.map((session) => (
                  <div
                    className="flex items-center justify-between rounded border p-3"
                    key={session.id}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{session.playName}</div>
                      <div className="text-muted-foreground text-sm">
                        {formatDate(session.practiceDate)} • {session.duration}{' '}
                        min • {session.playersPresent} players
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold">
                          {session.executionRating}/10
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Execution
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">
                          {session.successfulReps}/{session.totalReps}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Success
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">
                          {Math.round(
                            (session.successfulReps / session.totalReps) * 100
                          )}
                          %
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Rate
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Play Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Play Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.playCategories.map((category) => (
                  <div
                    className="flex items-center justify-between"
                    key={category.name}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-sm">
                        {category.name}
                      </span>
                    </div>
                    <span className="font-bold">{category.count}</span>
                  </div>
                ))}
              </div>
              {permissions.canManageCategories && (
                <Button
                  asChild
                  className="mt-4 w-full"
                  size="sm"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/playbook/categories"
                  >
                    Manage Categories
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Player Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Player Progress</CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/playbook/assignments"
                  >
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.playerAssignments.slice(0, 3).map((assignment) => (
                  <div className="space-y-2" key={assignment.playerId}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {assignment.playerName}
                      </span>
                      <Badge
                        variant={getPriorityColor(assignment.priorityLevel)}
                      >
                        {assignment.priorityLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{assignment.masteredPlays} mastered</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-orange-600" />
                        <span>{assignment.inProgressPlays} in progress</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{
                          width: `${(assignment.masteredPlays / assignment.assignedPlays) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.upcomingEvents.map((event) => (
                  <div className="rounded border p-3" key={event.title}>
                    <div className="mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{event.title}</span>
                    </div>
                    <div className="mb-2 text-muted-foreground text-xs">
                      {formatDate(event.date)}
                    </div>
                    <div className="space-y-1">
                      {event.plays.slice(0, 2).map((play) => (
                        <div className="text-xs" key={play}>
                          • {play}
                        </div>
                      ))}
                      {event.plays.length > 2 && (
                        <div className="text-muted-foreground text-xs">
                          +{event.plays.length - 2} more plays
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.canCreatePlays && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/playbook/plays/create"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Play
                  </Link>
                </Button>
              )}

              <Button
                asChild
                className="w-full justify-start"
                variant="outline"
              >
                <Link
                  params={{ organizationSlug }}
                  search={{
                    search: '',
                    category: 'All',
                    difficulty: 'All',
                    favorites: true,
                  }}
                  to="/$organizationSlug/playbook/plays"
                >
                  <Star className="mr-2 h-4 w-4" />
                  View Favorite Plays
                </Link>
              </Button>

              {permissions.canAssignPlays && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/playbook/assignments"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Assignments
                  </Link>
                </Button>
              )}

              {permissions.canViewAnalytics && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/playbook/analytics"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
