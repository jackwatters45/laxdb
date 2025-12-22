import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  Calendar,
  Dumbbell,
  Layers,
  Plus,
  Star,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for practice dashboard
const mockPracticeData = {
  stats: {
    totalDrills: 45,
    totalCategories: 8,
    favoriteDrills: 12,
    averageDrillDuration: 15,
    upcomingPractices: 2,
    practicesThisWeek: 3,
    drillsUsedThisWeek: 18,
  },
  recentDrills: [
    {
      id: '1',
      name: 'Fast Break Finish',
      category: 'Shooting',
      categoryColor: '#ef4444',
      difficulty: 'intermediate',
      duration: 20,
      playerCount: '6-12',
      equipment: ['Cones', 'Balls', 'Goals'],
      lastUsed: new Date('2024-09-23'),
      usageCount: 12,
      isFavorite: true,
      effectiveness: 8.5,
    },
    {
      id: '2',
      name: 'Ground Ball Battles',
      category: 'Fundamentals',
      categoryColor: '#10b981',
      difficulty: 'beginner',
      duration: 15,
      playerCount: '8-16',
      equipment: ['Balls', 'Cones'],
      lastUsed: new Date('2024-09-21'),
      usageCount: 8,
      isFavorite: false,
      effectiveness: 9.2,
    },
    {
      id: '3',
      name: 'Man Down Defense',
      category: 'Defense',
      categoryColor: '#3b82f6',
      difficulty: 'advanced',
      duration: 25,
      playerCount: '10+',
      equipment: ['Goals', 'Balls'],
      lastUsed: new Date('2024-09-19'),
      usageCount: 6,
      isFavorite: true,
      effectiveness: 7.8,
    },
  ],
  upcomingPractices: [
    {
      id: '1',
      name: 'Pre-Game Prep',
      date: new Date('2024-09-25'),
      time: '16:00',
      duration: 90,
      location: 'Main Field',
      drillCount: 8,
      focus: ['Shooting', 'Set Plays'],
      status: 'scheduled',
    },
    {
      id: '2',
      name: 'Fundamentals Focus',
      date: new Date('2024-09-27'),
      time: '17:30',
      duration: 120,
      location: 'Practice Field',
      drillCount: 12,
      focus: ['Passing', 'Ground Balls'],
      status: 'scheduled',
    },
  ],
  drillCategories: [
    { name: 'Shooting', count: 8, color: '#ef4444' },
    { name: 'Passing', count: 7, color: '#f59e0b' },
    { name: 'Defense', count: 6, color: '#3b82f6' },
    { name: 'Fundamentals', count: 9, color: '#10b981' },
    { name: 'Conditioning', count: 5, color: '#8b5cf6' },
    { name: 'Goalie', count: 4, color: '#ec4899' },
    { name: 'Face-offs', count: 3, color: '#14b8a6' },
    { name: 'Transition', count: 3, color: '#f97316' },
  ],
  recentPractices: [
    {
      id: '1',
      name: 'Game Prep Session',
      date: new Date('2024-09-23'),
      duration: 105,
      attendance: 16,
      drillsCompleted: 9,
      avgEffectiveness: 8.2,
    },
    {
      id: '2',
      name: 'Skills Development',
      date: new Date('2024-09-21'),
      duration: 120,
      attendance: 18,
      drillsCompleted: 12,
      avgEffectiveness: 8.7,
    },
    {
      id: '3',
      name: 'Conditioning Focus',
      date: new Date('2024-09-19'),
      duration: 90,
      attendance: 15,
      drillsCompleted: 8,
      avgEffectiveness: 7.9,
    },
  ],
};

// Server function for getting practice dashboard data
const getPracticeDashboard = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { PracticeAPI } = await import('@laxdb/core/practice/index');
  // const request = getRequest();
  // return await PracticeAPI.getPracticeDashboard(teamId, request.headers);

  return mockPracticeData;
});

// Server function for permissions
const getPracticePermissions = createServerFn().handler(async () => ({
  canCreateDrills: true,
  canSchedulePractices: true,
  canManageDrills: true,
  canViewAnalytics: true,
  canCreateTemplates: true,
}));

export const Route = createFileRoute('/_protected/$organizationSlug/practice/')(
  {
    component: PracticeDashboard,
    loader: async () => {
      const [data, permissions] = await Promise.all([
        getPracticeDashboard(),
        getPracticePermissions(),
      ]);

      return { data, permissions };
    },
  }
);

function PracticeDashboard() {
  const { organizationSlug } = Route.useParams();
  const { data, permissions } = Route.useLoaderData();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);

  const formatDateTime = (date: Date, time: string) => {
    const dateStr = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
    return `${dateStr} at ${time}`;
  };

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

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Practice</h1>
          <p className="text-muted-foreground">
            Manage drills and schedule practice sessions
          </p>
        </div>

        <div className="flex gap-2">
          {permissions.canCreateTemplates && (
            <Button asChild variant="outline">
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/practice/templates"
              >
                <Layers className="mr-2 h-4 w-4" />
                Templates
              </Link>
            </Button>
          )}
          {permissions.canSchedulePractices && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/practice/schedule"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Practice
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Drills</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{data.stats.totalDrills}</div>
            <p className="text-muted-foreground text-xs">
              Across {data.stats.totalCategories} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Avg Duration</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.stats.averageDrillDuration}m
            </div>
            <p className="text-muted-foreground text-xs">Per drill average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.stats.drillsUsedThisWeek}
            </div>
            <p className="text-muted-foreground text-xs">
              Drills used in practice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.stats.upcomingPractices}
            </div>
            <p className="text-muted-foreground text-xs">Practices scheduled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recently Used Drills */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recently Used Drills</CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link
                    params={{ organizationSlug }}
                    search={{
                      search: '',
                      category: 'All',
                      difficulty: 'All',
                      favorites: false,
                    }}
                    to="/$organizationSlug/practice/drills"
                  >
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentDrills.map((drill) => (
                  <div
                    className="flex items-center justify-between rounded border p-3"
                    key={drill.id}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: drill.categoryColor }}
                      >
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{drill.name}</span>
                          {drill.isFavorite && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {drill.category} • {drill.duration}min •{' '}
                          {drill.playerCount} players
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="font-bold text-sm">
                          {drill.effectiveness}/10
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Rating
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-sm">
                          {drill.usageCount}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Uses
                        </div>
                      </div>
                      <Badge variant={getDifficultyColor(drill.difficulty)}>
                        {drill.difficulty}
                      </Badge>
                      <Button disabled size="sm" variant="ghost">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Practices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Practices</CardTitle>
                <Button disabled size="sm" variant="ghost">
                  View Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.upcomingPractices.map((practice) => (
                  <div
                    className="flex items-center justify-between rounded border p-3"
                    key={practice.id}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{practice.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {formatDateTime(practice.date, practice.time)} •{' '}
                        {practice.location}
                      </div>
                      <div className="mt-1 flex gap-1">
                        {practice.focus.map((focus) => (
                          <Badge
                            className="text-xs"
                            key={focus}
                            variant="outline"
                          >
                            {focus}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold">{practice.duration}min</div>
                        <div className="text-muted-foreground text-xs">
                          Duration
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{practice.drillCount}</div>
                        <div className="text-muted-foreground text-xs">
                          Drills
                        </div>
                      </div>
                      <Button disabled size="sm" variant="ghost">
                        Edit
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
                <Button disabled size="sm" variant="ghost">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentPractices.map((session) => (
                  <div
                    className="flex items-center justify-between rounded border p-3"
                    key={session.id}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{session.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {formatDate(session.date)} • {session.duration}min
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold">{session.attendance}</div>
                        <div className="text-muted-foreground text-xs">
                          Players
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">
                          {session.drillsCompleted}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Drills
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">
                          {session.avgEffectiveness}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Rating
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
          {/* Drill Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Drill Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.drillCategories.map((category) => (
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
              {permissions.canManageDrills && (
                <Button
                  className="mt-4 w-full"
                  disabled
                  size="sm"
                  variant="outline"
                >
                  Manage Categories
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.canCreateDrills && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/practice/drills/create"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Drill
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
                    favorites: false,
                  }}
                  to="/$organizationSlug/practice/drills"
                >
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Browse Drill Bank
                </Link>
              </Button>

              {permissions.canSchedulePractices && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/practice/schedule"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Practice
                  </Link>
                </Button>
              )}

              <Button
                className="w-full justify-start"
                disabled
                variant="outline"
              >
                <Star className="mr-2 h-4 w-4" />
                View Favorite Drills
              </Button>

              {permissions.canViewAnalytics && (
                <Button
                  className="w-full justify-start"
                  disabled
                  variant="outline"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Practice Analytics
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Practice Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Practice Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="rounded bg-muted p-3">
                  <div className="font-medium">Optimal Practice Length</div>
                  <div className="text-muted-foreground text-xs">
                    90-120 minutes for maximum player engagement
                  </div>
                </div>
                <div className="rounded bg-muted p-3">
                  <div className="font-medium">Drill Variety</div>
                  <div className="text-muted-foreground text-xs">
                    Mix fundamentals with game situations
                  </div>
                </div>
                <div className="rounded bg-muted p-3">
                  <div className="font-medium">Intensity Balance</div>
                  <div className="text-muted-foreground text-xs">
                    Alternate high and low intensity drills
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
