import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Edit,
  MoreHorizontal,
  Play,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for individual play
const mockPlayData = {
  play: {
    id: '1',
    name: 'Quick Strike',
    description:
      'Fast-paced offensive play designed to create quick scoring opportunities through precise passing and movement. This play focuses on utilizing speed and precision to break through defensive formations.',
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
    createdBy: 'Coach Johnson',
    lastModified: new Date('2024-09-10'),
    notes:
      'Works best against zone defenses. Requires strong communication between midfielders.',
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Initial Formation',
        description:
          'Players set up in standard offensive formation with attackers positioned behind the goal.',
        duration: 10,
        playerPositions: ['Attack', 'Midfield'],
        instructions:
          'Attackers move to position behind goal line. Midfielders spread across the field at the restraining line.',
        keyPoints: [
          'Maintain 5-yard spacing between players',
          'Keep heads up for defensive reads',
          'Be ready to move on whistle',
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Ball Movement',
        description:
          'Quick passes to create opening and draw defenders out of position.',
        duration: 15,
        playerPositions: ['Attack', 'Midfield'],
        instructions:
          'Start with ball at X position. Quick passes to create 2-on-1 situations.',
        keyPoints: [
          'Crisp, accurate passes',
          'No more than 2 seconds with ball',
          'Look for defensive slides',
        ],
      },
      {
        id: 'step-3',
        stepNumber: 3,
        title: 'Final Attack',
        description:
          'Execute the scoring opportunity through coordinated movement and positioning.',
        duration: 20,
        playerPositions: ['Attack'],
        instructions:
          'When opening appears, drive hard to goal with backup ready.',
        keyPoints: [
          'Commit to the shot',
          'Follow through on rebounds',
          'Communicate with teammates',
        ],
      },
    ],
  },
  stats: {
    totalExecutions: 15,
    successfulExecutions: 13,
    lastFiveGames: [
      {
        gameDate: new Date('2024-09-22'),
        opponent: 'Eagles',
        successful: true,
        notes: 'Worked perfectly in 3rd quarter',
      },
      {
        gameDate: new Date('2024-09-18'),
        opponent: 'Lions',
        successful: true,
        notes: 'Defense adjusted after first use',
      },
      {
        gameDate: new Date('2024-09-14'),
        opponent: 'Panthers',
        successful: false,
        notes: 'Communication breakdown',
      },
      {
        gameDate: new Date('2024-09-10'),
        opponent: 'Bears',
        successful: true,
        notes: 'Led to 2 goals',
      },
      {
        gameDate: new Date('2024-09-06'),
        opponent: 'Wolves',
        successful: true,
        notes: 'Excellent execution',
      },
    ],
    practiceData: [
      {
        date: new Date('2024-09-23'),
        reps: 8,
        successfulReps: 7,
        notes: 'Good timing improvement',
      },
      {
        date: new Date('2024-09-21'),
        reps: 10,
        successfulReps: 9,
        notes: 'Excellent practice session',
      },
      {
        date: new Date('2024-09-19'),
        reps: 6,
        successfulReps: 4,
        notes: 'Need to work on step 2',
      },
    ],
  },
  assignments: [
    {
      playerId: '1',
      playerName: 'Alex Johnson',
      position: 'Attack',
      masteryLevel: 'advanced',
      lastPracticed: new Date('2024-09-23'),
      notes: 'Executes perfectly, good leader for this play',
    },
    {
      playerId: '2',
      playerName: 'Sarah Martinez',
      position: 'Midfield',
      masteryLevel: 'intermediate',
      lastPracticed: new Date('2024-09-23'),
      notes: 'Improving timing on passes',
    },
    {
      playerId: '3',
      playerName: 'Marcus Davis',
      position: 'Attack',
      masteryLevel: 'beginner',
      lastPracticed: new Date('2024-09-21'),
      notes: 'Still learning positioning, needs more practice',
    },
  ],
};

// Server function for getting play details
const getPlayDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { playId: string }) => data)
  .handler(async ({ data }) => mockPlayData);

// Server function for permissions
const getPlayPermissions = createServerFn().handler(async () => ({
  canEditPlay: true,
  canDeletePlay: true,
  canAssignPlay: true,
  canViewStats: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/playbook/plays/$playId'
)({
  component: PlayDetails,
  loader: async ({ params }) => {
    const [data, permissions] = await Promise.all([
      getPlayDetails({ data: { playId: params.playId } }),
      getPlayPermissions(),
    ]);

    return { data, permissions };
  },
});

function PlayDetails() {
  const { organizationSlug } = Route.useParams();
  const { data, permissions } = Route.useLoaderData();
  const { play, stats, assignments } = data;

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

  const getMasteryColor = (mastery: string) => {
    switch (mastery) {
      case 'beginner':
        return 'destructive';
      case 'intermediate':
        return 'default';
      case 'advanced':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPlayTypeIcon = (type: string) => {
    switch (type) {
      case 'offensive':
        return <Zap className="h-5 w-5" />;
      case 'defensive':
        return <Target className="h-5 w-5" />;
      case 'special_situations':
        return <Star className="h-5 w-5" />;
      case 'transition':
        return <TrendingUp className="h-5 w-5" />;
      case 'set_pieces':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild size="sm" variant="outline">
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
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: play.categoryColor }}
              >
                {getPlayTypeIcon(play.playType)}
              </div>
              <div>
                <h1 className="flex items-center gap-2 font-bold text-3xl">
                  {play.name}
                  {play.isFavorite && (
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  )}
                </h1>
                <p className="text-muted-foreground">
                  {play.category} • {play.difficultyLevel} level
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {permissions.canEditPlay && (
            <Button asChild variant="outline">
              <Link
                params={{ organizationSlug, playId: play.id }}
                to="/$organizationSlug/playbook/plays/$playId/edit"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          <Button disabled size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{play.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Duration:</strong> ~{play.estimatedDuration} seconds
                  </div>
                  <div>
                    <strong>Success Rate:</strong> {play.successRate}%
                  </div>
                  <div>
                    <strong>Times Used:</strong> {play.timesUsed}
                  </div>
                  <div>
                    <strong>Last Used:</strong> {formatDate(play.lastUsed)}
                  </div>
                </div>

                <div>
                  <strong className="text-sm">Positions:</strong>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {play.playerPositions.map((position) => (
                      <Badge key={position} variant="outline">
                        {position}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <strong className="text-sm">Tags:</strong>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {play.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {play.notes && (
                  <div>
                    <strong className="text-sm">Coach Notes:</strong>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {play.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Play Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Play Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {play.steps.map((step, index) => (
                  <div className="relative" key={step.id}>
                    {index < play.steps.length - 1 && (
                      <div className="absolute top-12 left-6 h-full w-px bg-border" />
                    )}

                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                        {step.stepNumber}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-semibold">{step.title}</h4>
                          <p className="text-muted-foreground text-sm">
                            {step.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Duration:</strong> {step.duration} seconds
                          </div>
                          <div>
                            <strong>Positions:</strong>{' '}
                            {step.playerPositions.join(', ')}
                          </div>
                        </div>

                        {step.instructions && (
                          <div>
                            <strong className="text-sm">Instructions:</strong>
                            <p className="text-muted-foreground text-sm">
                              {step.instructions}
                            </p>
                          </div>
                        )}

                        {step.keyPoints.length > 0 && (
                          <div>
                            <strong className="text-sm">Key Points:</strong>
                            <ul className="mt-1 ml-4 list-disc text-muted-foreground text-sm">
                              {step.keyPoints.map((point) => (
                                <li key={point}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          {permissions.canViewStats && (
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Recent Games */}
                  <div>
                    <h4 className="mb-3 font-medium">Recent Games</h4>
                    <div className="space-y-2">
                      {stats.lastFiveGames.map((game) => (
                        <div
                          className="flex items-center justify-between rounded border p-3"
                          key={`${game.gameDate}-${game.opponent}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-3 w-3 rounded-full ${game.successful ? 'bg-green-500' : 'bg-red-500'}`}
                            />
                            <div>
                              <div className="font-medium text-sm">
                                vs {game.opponent}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatDate(game.gameDate)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-medium text-sm ${game.successful ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {game.successful ? 'Success' : 'Failed'}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {game.notes}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Practice Data */}
                  <div>
                    <h4 className="mb-3 font-medium">
                      Recent Practice Sessions
                    </h4>
                    <div className="space-y-2">
                      {stats.practiceData.map((session) => (
                        <div
                          className="flex items-center justify-between rounded border p-3"
                          key={session.date.getTime()}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {formatDate(session.date)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {session.notes}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              {session.successfulReps}/{session.reps} reps
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {Math.round(
                                (session.successfulReps / session.reps) * 100
                              )}
                              % success
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Success Rate
                  </span>
                  <span className="font-bold">{play.successRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total Uses
                  </span>
                  <span className="font-bold">{play.timesUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Difficulty
                  </span>
                  <Badge variant={getDifficultyColor(play.difficultyLevel)}>
                    {play.difficultyLevel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Duration
                  </span>
                  <span className="font-bold">~{play.estimatedDuration}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Information */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Created by:</span>
                  <div className="font-medium">{play.createdBy}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium">
                    {formatDate(play.createdDate)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last modified:</span>
                  <div className="font-medium">
                    {formatDate(play.lastModified)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last used:</span>
                  <div className="font-medium">{formatDate(play.lastUsed)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Assignments */}
          {permissions.canAssignPlay && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Player Assignments</CardTitle>
                  <Button disabled size="sm" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      className="rounded border p-3"
                      key={assignment.playerId}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {assignment.playerName}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {assignment.position}
                          </div>
                        </div>
                        <Badge
                          variant={getMasteryColor(assignment.masteryLevel)}
                        >
                          {assignment.masteryLevel}
                        </Badge>
                      </div>
                      <div className="mt-2 text-muted-foreground text-xs">
                        Last practiced: {formatDate(assignment.lastPracticed)}
                      </div>
                      {assignment.notes && (
                        <div className="mt-1 text-muted-foreground text-xs">
                          {assignment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.canEditPlay && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug, playId: play.id }}
                    to="/$organizationSlug/playbook/plays/$playId/edit"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Play
                  </Link>
                </Button>
              )}

              <Button
                className="w-full justify-start"
                disabled
                variant="outline"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Practice
              </Button>

              <Button
                className="w-full justify-start"
                disabled
                variant="outline"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>

              <Button
                className="w-full justify-start"
                disabled
                variant="outline"
              >
                <Star className="mr-2 h-4 w-4" />
                {play.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
