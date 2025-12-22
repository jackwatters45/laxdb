import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  AlertCircle,
  Calendar,
  Eye,
  FileText,
  Plus,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for the dashboard
const mockScoutingData = {
  stats: {
    totalTeams: 12,
    totalReports: 28,
    reportsThisMonth: 8,
    upcomingGames: 3,
  },
  recentReports: [
    {
      id: '1',
      title: 'Central Valley Eagles - Offensive Analysis',
      teamName: 'Central Valley Eagles',
      createdDate: new Date('2024-09-20'),
      priority: 'high' as const,
      confidence: 8,
      scoutName: 'Coach Johnson',
    },
    {
      id: '2',
      title: 'Riverside Hawks - Full Team Scout',
      teamName: 'Riverside Hawks',
      createdDate: new Date('2024-09-18'),
      priority: 'medium' as const,
      confidence: 7,
      scoutName: 'Assistant Coach Smith',
    },
    {
      id: '3',
      title: 'North County Titans - Special Situations',
      teamName: 'North County Titans',
      createdDate: new Date('2024-09-15'),
      priority: 'high' as const,
      confidence: 9,
      scoutName: 'Coach Johnson',
    },
  ],
  upcomingOpponents: [
    {
      id: '1',
      name: 'Riverside Hawks',
      gameDate: new Date('2024-09-25T15:00:00'),
      lastScoutedDate: new Date('2024-09-18'),
      reportsCount: 3,
      priority: 'high' as const,
    },
    {
      id: '2',
      name: 'North County Titans',
      gameDate: new Date('2024-10-02T16:00:00'),
      lastScoutedDate: new Date('2024-09-15'),
      reportsCount: 2,
      priority: 'medium' as const,
    },
    {
      id: '3',
      name: 'Valley Storm',
      gameDate: new Date('2024-10-08T14:00:00'),
      lastScoutedDate: null,
      reportsCount: 0,
      priority: 'high' as const,
    },
  ],
  alerts: [
    {
      type: 'missing_report' as const,
      message: 'Valley Storm game in 10 days - No scouting reports available',
      priority: 'high' as const,
      createdAt: new Date().setDate(new Date().getDate() - 6),
    },
    {
      type: 'outdated_report' as const,
      message: 'Riverside Hawks - Last report is 7 days old',
      priority: 'medium' as const,
      createdAt: new Date().setDate(new Date().getDate() - 7),
    },
  ],
};

// Server function for getting scouting dashboard data
const getScoutingDashboard = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { ScoutingAPI } = await import('@laxdb/core/scouting/index');
  // const request = getRequest();
  // return await ScoutingAPI.getDashboardData(request.headers);

  return mockScoutingData;
});

// Server function for permissions
const getScoutingPermissions = createServerFn().handler(async () => ({
  canCreateReports: true,
  canManageTeams: true,
  canViewAllReports: true,
}));

export const Route = createFileRoute('/_protected/$organizationSlug/scouting/')(
  {
    component: ScoutingDashboard,
    loader: async () => {
      const [data, permissions] = await Promise.all([
        getScoutingDashboard(),
        getScoutingPermissions(),
      ]);

      return { data, permissions };
    },
  }
);

function ScoutingDashboard() {
  const { organizationSlug } = Route.useParams();
  const { data, permissions } = Route.useLoaderData();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'missing_report':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'outdated_report':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Scouting Dashboard</h1>
          <p className="text-muted-foreground">
            Manage opposing teams and create strategic reports
          </p>
        </div>

        <div className="flex gap-2">
          {permissions.canManageTeams && (
            <Button asChild variant="outline">
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/scouting/teams/create"
              >
                <Users className="mr-2 h-4 w-4" />
                Add Team
              </Link>
            </Button>
          )}
          {permissions.canCreateReports && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/scouting/teams/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Report
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alerts.map((alert) => (
                <div className="flex items-center gap-2" key={alert.createdAt}>
                  {getAlertIcon(alert.type)}
                  <span className="text-sm">{alert.message}</span>
                  <Badge
                    className="ml-auto"
                    variant={getPriorityColor(alert.priority)}
                  >
                    {alert.priority.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Teams Tracked</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{data.stats.totalTeams}</div>
            <p className="text-muted-foreground text-xs">
              Opposing teams in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{data.stats.totalReports}</div>
            <p className="text-muted-foreground text-xs">
              Scouting reports created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.stats.reportsThisMonth}
            </div>
            <p className="text-muted-foreground text-xs">
              Reports created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Upcoming Games
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{data.stats.upcomingGames}</div>
            <p className="text-muted-foreground text-xs">
              Games in next 2 weeks
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Scouting Reports</CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link
                  params={{ organizationSlug }}
                  to="/$organizationSlug/scouting/teams"
                >
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentReports.map((report) => (
                <div
                  className="flex items-center justify-between rounded border p-3"
                  key={report.id}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{report.title}</div>
                    <div className="text-muted-foreground text-xs">
                      by {report.scoutName} • {formatDate(report.createdDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(report.priority)}>
                      {report.priority}
                    </Badge>
                    <div className="text-right text-xs">
                      <div className="font-medium">Confidence</div>
                      <div className="text-muted-foreground">
                        {report.confidence}/10
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        params={{ organizationSlug }}
                        to="/$organizationSlug/scouting/teams"
                      >
                        <Eye className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Opponents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Opponents</CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link
                  params={{ organizationSlug }}
                  to="/$organizationSlug/scouting/teams"
                >
                  View All Teams
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingOpponents.map((opponent) => (
                <div
                  className="flex items-center justify-between rounded border p-3"
                  key={opponent.id}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{opponent.name}</div>
                    <div className="text-muted-foreground text-xs">
                      Game: {formatDate(opponent.gameDate)}
                      {opponent.lastScoutedDate &&
                        ` • Last scouted: ${formatDate(opponent.lastScoutedDate)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center text-xs">
                      <div className="font-medium">{opponent.reportsCount}</div>
                      <div className="text-muted-foreground">reports</div>
                    </div>
                    {opponent.reportsCount === 0 && (
                      <Badge variant="destructive">No Reports</Badge>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        params={{
                          organizationSlug,
                          teamId: opponent.id,
                        }}
                        to="/$organizationSlug/scouting/teams/$teamId"
                      >
                        <Eye className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {permissions.canCreateReports && (
              <Button
                asChild
                className="h-auto flex-col gap-2 p-4"
                variant="outline"
              >
                <Link
                  params={{ organizationSlug }}
                  to="/$organizationSlug/scouting/teams/create"
                >
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Create Report</div>
                    <div className="text-muted-foreground text-xs">
                      Start a new scouting report
                    </div>
                  </div>
                </Link>
              </Button>
            )}

            {permissions.canManageTeams && (
              <Button
                asChild
                className="h-auto flex-col gap-2 p-4"
                variant="outline"
              >
                <Link
                  params={{ organizationSlug }}
                  to="/$organizationSlug/scouting/teams/create"
                >
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Add Opposing Team</div>
                    <div className="text-muted-foreground text-xs">
                      Track a new opponent
                    </div>
                  </div>
                </Link>
              </Button>
            )}

            <Button
              asChild
              className="h-auto flex-col gap-2 p-4"
              variant="outline"
            >
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/scouting/teams"
              >
                <Target className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Browse Teams</div>
                  <div className="text-muted-foreground text-xs">
                    View all opposing teams
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
