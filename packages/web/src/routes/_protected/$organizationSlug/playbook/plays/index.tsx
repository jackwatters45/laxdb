import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  BookOpen,
  Clock,
  Filter,
  Play,
  Plus,
  Search,
  Star,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Mock data for plays list
const mockPlaysData = {
  plays: [
    {
      id: '1',
      name: 'Quick Strike',
      description:
        'Fast-paced offensive play designed to create quick scoring opportunities through precise passing and movement.',
      category: 'Offensive',
      categoryColor: '#10b981',
      playType: 'offensive',
      difficultyLevel: 'intermediate',
      createdDate: new Date('2024-08-15'),
      lastUsed: new Date('2024-09-22'),
      successRate: 85,
      timesUsed: 15,
      isFavorite: true,
      estimatedDuration: 45,
      playerPositions: ['Attack', 'Midfield', 'LSM'],
      tags: ['fast-break', 'scoring', 'transition'],
      steps: 8,
    },
    {
      id: '2',
      name: 'Zone Press',
      description:
        'Defensive strategy focusing on zone coverage and aggressive pressure to force turnovers.',
      category: 'Defensive',
      categoryColor: '#ef4444',
      playType: 'defensive',
      difficultyLevel: 'advanced',
      createdDate: new Date('2024-07-20'),
      lastUsed: new Date('2024-09-20'),
      successRate: 67,
      timesUsed: 8,
      isFavorite: false,
      estimatedDuration: 60,
      playerPositions: ['Defense', 'LSM', 'Goalie'],
      tags: ['pressure', 'zone', 'turnover'],
      steps: 12,
    },
    {
      id: '3',
      name: 'Man Up Motion',
      description:
        'Special situation play for man-up advantages, emphasizing ball movement and creating open shots.',
      category: 'Special Situations',
      categoryColor: '#f59e0b',
      playType: 'special_situations',
      difficultyLevel: 'intermediate',
      createdDate: new Date('2024-06-10'),
      lastUsed: new Date('2024-09-18'),
      successRate: 78,
      timesUsed: 12,
      isFavorite: true,
      estimatedDuration: 90,
      playerPositions: ['Attack', 'Midfield'],
      tags: ['man-up', 'motion', 'extra-man'],
      steps: 10,
    },
    {
      id: '4',
      name: 'Transition Clear',
      description:
        'Structured clearing pattern from defense to offense, focusing on maintaining possession and field position.',
      category: 'Transition',
      categoryColor: '#3b82f6',
      playType: 'transition',
      difficultyLevel: 'beginner',
      createdDate: new Date('2024-09-01'),
      lastUsed: new Date('2024-09-21'),
      successRate: 92,
      timesUsed: 22,
      isFavorite: false,
      estimatedDuration: 30,
      playerPositions: ['Defense', 'Midfield', 'Attack'],
      tags: ['clearing', 'possession', 'field-position'],
      steps: 6,
    },
    {
      id: '5',
      name: 'Face-off Wing',
      description:
        'Specialized face-off play focusing on wing support and quick transitions after possession gain.',
      category: 'Set Pieces',
      categoryColor: '#8b5cf6',
      playType: 'set_pieces',
      difficultyLevel: 'advanced',
      createdDate: new Date('2024-08-05'),
      lastUsed: new Date('2024-09-19'),
      successRate: 73,
      timesUsed: 18,
      isFavorite: true,
      estimatedDuration: 15,
      playerPositions: ['Face-off', 'Wing', 'Midfield'],
      tags: ['face-off', 'wing', 'possession'],
      steps: 5,
    },
    {
      id: '6',
      name: 'Box Dodge',
      description:
        'Individual offensive technique for creating separation and scoring opportunities in tight spaces.',
      category: 'Offensive',
      categoryColor: '#10b981',
      playType: 'offensive',
      difficultyLevel: 'intermediate',
      createdDate: new Date('2024-07-15'),
      lastUsed: new Date('2024-09-16'),
      successRate: 68,
      timesUsed: 9,
      isFavorite: false,
      estimatedDuration: 20,
      playerPositions: ['Attack'],
      tags: ['dodging', 'individual', 'scoring'],
      steps: 4,
    },
  ],
  categories: [
    { name: 'All', count: 24, color: '#6b7280' },
    { name: 'Offensive', count: 8, color: '#10b981' },
    { name: 'Defensive', count: 6, color: '#ef4444' },
    { name: 'Special Situations', count: 4, color: '#f59e0b' },
    { name: 'Transition', count: 4, color: '#3b82f6' },
    { name: 'Set Pieces', count: 2, color: '#8b5cf6' },
  ],
  difficultyLevels: ['All', 'Beginner', 'Intermediate', 'Advanced'],
};

// Server function for getting plays data
const getPlaysData = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { PlaybookAPI } = await import('@laxdb/core/playbook/index');
  // const request = getRequest();
  // return await PlaybookAPI.getPlays(teamId, filters, request.headers);

  return mockPlaysData;
});

// Server function for permissions
const getPlaysPermissions = createServerFn().handler(async () => ({
  canCreatePlays: true,
  canEditPlays: true,
  canDeletePlays: true,
  canViewAnalytics: true,
  canAssignPlays: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/playbook/plays/'
)({
  component: PlaysList,
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || '',
    category: (search.category as string) || 'All',
    difficulty: (search.difficulty as string) || 'All',
    favorites: search.favorites === 'true' || search.filter === 'favorites',
  }),
  loader: async () => {
    const [data, permissions] = await Promise.all([
      getPlaysData(),
      getPlaysPermissions(),
    ]);

    return { data, permissions };
  },
});

function PlaysList() {
  const { organizationSlug } = Route.useParams();
  const { data, permissions } = Route.useLoaderData();
  const search = Route.useSearch();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
      case 'set_pieces':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  // Filter plays based on search criteria
  const filteredPlays = data.plays.filter((play) => {
    const matchesSearch =
      search.search === '' ||
      play.name.toLowerCase().includes(search.search.toLowerCase()) ||
      play.description.toLowerCase().includes(search.search.toLowerCase()) ||
      play.tags.some((tag) =>
        tag.toLowerCase().includes(search.search.toLowerCase())
      );

    const matchesCategory =
      search.category === 'All' || play.category === search.category;

    const matchesDifficulty =
      search.difficulty === 'All' ||
      play.difficultyLevel.toLowerCase() === search.difficulty.toLowerCase();

    const matchesFavorites = !search.favorites || play.isFavorite;

    return (
      matchesSearch && matchesCategory && matchesDifficulty && matchesFavorites
    );
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Plays</h1>
          <p className="text-muted-foreground">
            Browse and manage your team's playbook
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/playbook"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
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

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search plays..." />
            </div>

            {/* Category Filter */}
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              {data.categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              {data.difficultyLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {/* Favorites Toggle */}
            <div className="flex items-center gap-2">
              <input
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                id="favorites"
                type="checkbox"
              />
              <label className="font-medium text-sm" htmlFor="favorites">
                Favorites only
              </label>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-muted-foreground text-sm">
            Showing {filteredPlays.length} of {data.plays.length} plays
          </div>
        </CardContent>
      </Card>

      {/* Plays Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlays.map((play) => (
          <Card
            className="group transition-shadow hover:shadow-lg"
            key={play.id}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: play.categoryColor }}
                  >
                    {getPlayTypeIcon(play.playType)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Link
                        className="hover:underline"
                        params={{ organizationSlug, playId: play.id }}
                        to="/$organizationSlug/playbook/plays/$playId"
                      >
                        {play.name}
                      </Link>
                      {play.isFavorite && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {play.category}
                    </p>
                  </div>
                </div>
                <Badge variant={getDifficultyColor(play.difficultyLevel)}>
                  {play.difficultyLevel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
                {play.description}
              </p>

              {/* Statistics */}
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold">{play.successRate}%</div>
                  <div className="text-muted-foreground text-xs">Success</div>
                </div>
                <div>
                  <div className="font-bold">{play.timesUsed}</div>
                  <div className="text-muted-foreground text-xs">Uses</div>
                </div>
                <div>
                  <div className="font-bold">{play.steps}</div>
                  <div className="text-muted-foreground text-xs">Steps</div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4 flex flex-wrap gap-1">
                {play.tags.slice(0, 3).map((tag) => (
                  <Badge className="text-xs" key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {play.tags.length > 3 && (
                  <Badge className="text-xs" variant="outline">
                    +{play.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Meta info */}
              <div className="mb-4 space-y-1 text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>~{play.estimatedDuration} seconds</span>
                </div>
                <div>Last used: {formatDate(play.lastUsed)}</div>
                <div>Positions: {play.playerPositions.join(', ')}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button asChild className="flex-1" size="sm">
                  <Link
                    params={{ organizationSlug, playId: play.id }}
                    to="/$organizationSlug/playbook/plays/$playId"
                  >
                    View Details
                  </Link>
                </Button>
                {permissions.canEditPlays && (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      params={{ organizationSlug, playId: play.id }}
                      to="/$organizationSlug/playbook/plays/$playId/edit"
                    >
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlays.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">No plays found</h3>
            <p className="mb-4 text-muted-foreground">
              Try adjusting your search criteria or create a new play.
            </p>
            {permissions.canCreatePlays && (
              <Button asChild>
                <Link
                  params={{ organizationSlug }}
                  to="/$organizationSlug/playbook/plays/create"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Play
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
