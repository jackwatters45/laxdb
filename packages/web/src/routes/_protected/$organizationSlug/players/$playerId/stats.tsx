import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Calendar, TrendingUp, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock detailed stats data
const mockPlayerStats = {
  playerName: 'Alex Johnson',
  season: {
    gamesPlayed: 12,
    goals: 18,
    assists: 12,
    shots: 45,
    shotsOnGoal: 28,
    shotAccuracy: 62.2,
    groundBalls: 15,
    turnovers: 8,
    causedTurnovers: 5,
    penalties: 3,
    penaltyMinutes: 6,
    minutesPlayed: 35.2,
    plusMinus: 8,
  },
  gameLog: [
    {
      id: '1',
      date: new Date('2024-09-15'),
      opponent: 'Valley High',
      result: 'W 12-8',
      goals: 2,
      assists: 1,
      shots: 4,
      groundBalls: 2,
      minutes: 38,
    },
    {
      id: '2',
      date: new Date('2024-09-08'),
      opponent: 'Mountain View',
      result: 'L 9-11',
      goals: 1,
      assists: 2,
      shots: 5,
      groundBalls: 1,
      minutes: 42,
    },
    {
      id: '3',
      date: new Date('2024-09-01'),
      opponent: 'Central Academy',
      result: 'W 15-6',
      goals: 3,
      assists: 1,
      shots: 6,
      groundBalls: 3,
      minutes: 28,
    },
  ],
  seasonTrends: {
    goalsByGame: [1, 0, 2, 1, 3, 1, 2, 1, 0, 2, 1, 2],
    assistsByGame: [1, 2, 0, 1, 1, 2, 1, 0, 1, 1, 2, 1],
    shotAccuracyByGame: [50, 0, 66, 50, 50, 33, 50, 0, 0, 50, 50, 50],
  },
};

const getPlayerDetailedStats = createServerFn({ method: 'GET' })
  .inputValidator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    return mockPlayerStats;
  });

export const Route = createFileRoute(
  '/_protected/$organizationSlug/players/$playerId/stats'
)({
  component: PlayerStatsPage,
  loader: async ({ params }) => {
    const stats = await getPlayerDetailedStats({
      data: { playerId: params.playerId },
    });
    return stats;
  },
});

function PlayerStatsPage() {
  const stats = Route.useLoaderData();
  const { organizationSlug, playerId } = Route.useParams();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link
          params={{ organizationSlug, playerId }}
          to="/$organizationSlug/players/$playerId"
        >
          <Button className="mb-4" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {stats.playerName}
          </Button>
        </Link>

        <div>
          <h1 className="font-bold text-3xl">Detailed Statistics</h1>
          <p className="text-muted-foreground">
            Complete season performance for {stats.playerName}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Season Stats */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Season Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Scoring</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Goals:</span>
                      <span className="font-medium">{stats.season.goals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assists:</span>
                      <span className="font-medium">
                        {stats.season.assists}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Points:</span>
                      <span className="font-medium">
                        {stats.season.goals + stats.season.assists}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Shooting</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Shots:</span>
                      <span className="font-medium">{stats.season.shots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On Goal:</span>
                      <span className="font-medium">
                        {stats.season.shotsOnGoal}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span className="font-medium">
                        {stats.season.shotAccuracy.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Other</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ground Balls:</span>
                      <span className="font-medium">
                        {stats.season.groundBalls}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Turnovers:</span>
                      <span className="font-medium">
                        {stats.season.turnovers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>+/-:</span>
                      <span className="font-medium">
                        +{stats.season.plusMinus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.gameLog.map((game) => (
                  <div
                    className="flex items-center justify-between rounded border p-3"
                    key={game.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-medium text-sm">
                          {formatDate(game.date)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          vs {game.opponent}
                        </div>
                      </div>
                      <Badge
                        variant={
                          game.result.startsWith('W')
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {game.result}
                      </Badge>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{game.goals}</div>
                        <div className="text-muted-foreground text-xs">G</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{game.assists}</div>
                        <div className="text-muted-foreground text-xs">A</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{game.shots}</div>
                        <div className="text-muted-foreground text-xs">SOG</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{game.minutes}</div>
                        <div className="text-muted-foreground text-xs">MIN</div>
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
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Points per Game:</span>
                  <span className="font-medium">
                    {(
                      (stats.season.goals + stats.season.assists) /
                      stats.season.gamesPlayed
                    ).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Goals per Game:</span>
                  <span className="font-medium">
                    {(stats.season.goals / stats.season.gamesPlayed).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Minutes per Game:</span>
                  <span className="font-medium">
                    {stats.season.minutesPlayed.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shots per Game:</span>
                  <span className="font-medium">
                    {(stats.season.shots / stats.season.gamesPlayed).toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Season Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded bg-green-50 p-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Shot accuracy improving</span>
                </div>
                <div className="flex items-center gap-2 rounded bg-blue-50 p-2 text-sm">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  <span>Consistent scoring threat</span>
                </div>
                <div className="flex items-center gap-2 rounded bg-orange-50 p-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span>Playing time increasing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
