import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  Calendar,
  Edit,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for team details
const mockTeamDetails = {
  id: '1',
  name: 'Riverside Hawks',
  leagueName: 'Metro Lacrosse League',
  division: 'Division A',
  coachName: 'Mike Thompson',
  assistantCoaches: ['Sarah Johnson', 'David Lee'],
  homeField: 'Riverside Sports Complex',
  teamColors: 'Blue and Gold',
  mascot: 'Hawks',
  coachEmail: 'coach@riversidehawks.com',
  coachPhone: '(555) 123-4567',
  teamWebsite: 'https://riversidehawks.com',
  typicalStyle: 'aggressive' as const,

  // Performance Data
  wins: 8,
  losses: 3,
  ties: 1,
  goalsFor: 156,
  goalsAgainst: 98,

  // Strategic Info
  strengths: [
    'Fast Break Offense',
    'Strong Defense',
    'Experienced Goalie',
    'Good Depth',
  ],
  weaknesses: ['Poor Face-offs', 'Weak on Left Side', 'Penalty Prone'],
  keyPlayers: [
    '#23 Johnson (Attack) - Team Captain, 25 goals',
    '#1 Smith (Goalie) - .750 save percentage',
    '#15 Davis (Midfield) - Face-off specialist',
    '#7 Wilson (Defense) - Team leader',
  ],

  // Scouting Data
  reportsCount: 3,
  lastScoutedDate: new Date('2024-09-18'),
  nextGameDate: new Date('2024-09-25T15:00:00'),

  notes:
    'This team has improved significantly since last season. They have a new assistant coach focusing on face-offs, which has helped their weak spot. Watch out for their transition game - they can score quickly on turnovers.',

  // Recent Reports
  recentReports: [
    {
      id: '1',
      title: 'Full Team Analysis - Sept Game',
      date: new Date('2024-09-18'),
      scoutName: 'Coach Johnson',
      confidenceLevel: 8,
      priority: 'high' as const,
    },
    {
      id: '2',
      title: 'Offensive Patterns Study',
      date: new Date('2024-09-10'),
      scoutName: 'Assistant Coach Smith',
      confidenceLevel: 7,
      priority: 'medium' as const,
    },
    {
      id: '3',
      title: 'Special Situations Analysis',
      date: new Date('2024-09-05'),
      scoutName: 'Coach Johnson',
      confidenceLevel: 9,
      priority: 'high' as const,
    },
  ],

  // Head-to-Head History
  headToHeadHistory: [
    {
      date: new Date('2024-03-15'),
      ourScore: 12,
      theirScore: 8,
      venue: 'Home',
      result: 'win' as const,
    },
    {
      date: new Date('2023-10-20'),
      ourScore: 6,
      theirScore: 10,
      venue: 'Away',
      result: 'loss' as const,
    },
    {
      date: new Date('2023-05-12'),
      ourScore: 15,
      theirScore: 11,
      venue: 'Home',
      result: 'win' as const,
    },
  ],
};

// Server function for getting team details
const getOpposingTeamDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { teamId: string }) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    // const { ScoutingAPI } = await import('@laxdb/core/scouting/index');
    // return await ScoutingAPI.getOpposingTeam(data.teamId, headers);

    return mockTeamDetails;
  });

// Server function for permissions
const getScoutingPermissions = createServerFn().handler(async () => ({
  canEdit: true,
  canCreateReports: true,
  canManagePlayers: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/scouting/teams/$teamId'
)({
  component: OpposingTeamDetailsPage,
  loader: async ({ params }) => {
    const [team, permissions] = await Promise.all([
      getOpposingTeamDetails({ data: { teamId: params.teamId } }),
      getScoutingPermissions(),
    ]);

    return { team, permissions };
  },
});

function OpposingTeamDetailsPage() {
  const { organizationSlug } = Route.useParams();
  const { team, permissions } = Route.useLoaderData();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

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

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const winPercentage = getWinPercentage(team.wins, team.losses, team.ties);
  const goalDifferential = team.goalsFor - team.goalsAgainst;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-3xl">{team.name}</h1>
            <p className="text-muted-foreground">
              {team.leagueName} • {team.division}
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant={getStyleColor(team.typicalStyle)}>
              {getStyleLabel(team.typicalStyle)}
            </Badge>
            {permissions.canEdit && (
              <Button asChild size="sm" variant="outline">
                <Link
                  params={{ organizationSlug }}
                  to="/$organizationSlug/scouting/teams/create"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Team
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Season Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="font-bold text-2xl">
                    {team.wins}-{team.losses}-{team.ties}
                  </div>
                  <div className="text-muted-foreground text-sm">Record</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 font-bold text-2xl">
                    {winPercentage}%
                    {winPercentage >= 60 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Win Percentage
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl">
                    {goalDifferential > 0 ? '+' : ''}
                    {goalDifferential}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Goal Differential
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{team.goalsFor}</div>
                  <div className="text-muted-foreground">Goals For</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{team.goalsAgainst}</div>
                  <div className="text-muted-foreground">Goals Against</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-green-700">Strengths</h4>
                <div className="space-y-1">
                  {team.strengths.map((strength) => (
                    <div className="text-sm" key={strength}>
                      • {strength}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-red-700">Weaknesses</h4>
                <div className="space-y-1">
                  {team.weaknesses.map((weakness) => (
                    <div className="text-sm" key={weakness}>
                      • {weakness}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Key Players</h4>
                <div className="space-y-1">
                  {team.keyPlayers.map((player) => (
                    <div className="text-sm" key={player}>
                      • {player}
                    </div>
                  ))}
                </div>
              </div>

              {team.notes && (
                <div>
                  <h4 className="mb-2 font-medium">Additional Notes</h4>
                  <p className="text-muted-foreground text-sm">{team.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Scouting Reports */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Scouting Reports</CardTitle>
                {permissions.canCreateReports && (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      params={{ organizationSlug }}
                      to="/$organizationSlug/scouting/teams/create"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Report
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {team.recentReports.length > 0 ? (
                <div className="space-y-3">
                  {team.recentReports.map((report) => (
                    <div
                      className="flex items-center justify-between rounded border p-3"
                      key={report.id}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {report.title}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          by {report.scoutName} • {formatDate(report.date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(report.priority)}>
                          {report.priority}
                        </Badge>
                        <div className="text-right text-xs">
                          <div className="font-medium">Confidence</div>
                          <div className="text-muted-foreground">
                            {report.confidenceLevel}/10
                          </div>
                        </div>
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            params={{ organizationSlug }}
                            to="/$organizationSlug/scouting/teams"
                          >
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8" />
                  <p>No scouting reports yet</p>
                  {permissions.canCreateReports && (
                    <Button
                      asChild
                      className="mt-2"
                      size="sm"
                      variant="outline"
                    >
                      <Link
                        params={{ organizationSlug }}
                        to="/$organizationSlug/scouting/teams/create"
                      >
                        Create First Report
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Coach: {team.coachName}</span>
              </div>

              {team.assistantCoaches.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <div>Assistant Coaches:</div>
                    {team.assistantCoaches.map((coach) => (
                      <div className="text-muted-foreground" key={coach}>
                        • {coach}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{team.homeField}</span>
              </div>

              {team.teamColors && (
                <div className="text-sm">
                  <span className="font-medium">Colors:</span> {team.teamColors}
                </div>
              )}

              {team.coachEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="text-blue-600 hover:underline"
                    href={`mailto:${team.coachEmail}`}
                  >
                    {team.coachEmail}
                  </a>
                </div>
              )}

              {team.coachPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="text-blue-600 hover:underline"
                    href={`tel:${team.coachPhone}`}
                  >
                    {team.coachPhone}
                  </a>
                </div>
              )}

              {team.teamWebsite && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="text-blue-600 hover:underline"
                    href={team.teamWebsite}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Team Website
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.canCreateReports && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/scouting/teams/create"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create Scouting Report
                  </Link>
                </Button>
              )}

              {permissions.canManagePlayers && (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/scouting/teams"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Players
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
                  to="/$organizationSlug/scouting/teams"
                >
                  <Target className="mr-2 h-4 w-4" />
                  View Patterns
                </Link>
              </Button>

              {team.nextGameDate && (
                <div className="mt-4 rounded bg-muted p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium text-sm">Next Game</span>
                  </div>
                  <div className="text-sm">{formatDate(team.nextGameDate)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Head-to-Head History */}
          <Card>
            <CardHeader>
              <CardTitle>Head-to-Head History</CardTitle>
            </CardHeader>
            <CardContent>
              {team.headToHeadHistory.length > 0 ? (
                <div className="space-y-2">
                  {team.headToHeadHistory.map((game) => (
                    <div
                      className="flex items-center justify-between text-sm"
                      key={game.date.getTime()}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            game.result === 'win' ? 'default' : 'secondary'
                          }
                        >
                          {game.result.toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatDate(game.date)}
                        </span>
                      </div>
                      <div className="font-medium">
                        {game.ourScore} - {game.theirScore}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm">
                  No previous games
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
