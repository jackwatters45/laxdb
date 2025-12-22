import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Star,
  StopCircle,
  Timer,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for practice session
const mockSessionData = {
  session: {
    id: '1',
    name: 'Pre-Game Prep',
    date: new Date('2024-09-25'),
    scheduledTime: '16:00',
    duration: 90,
    location: 'Main Field',
    status: 'in_progress',
    actualStartTime: new Date('2024-09-25T16:05:00'),
    actualEndTime: null,
    objectives: [
      'Perfect set plays execution',
      'Build confidence for upcoming game',
      'Fine-tune defensive positioning',
    ],
    notes: 'Focus on execution under pressure. Weather conditions are perfect.',
    weatherConditions: 'Sunny, 72°F',
    fieldConditions: 'Excellent',
  },
  drills: [
    {
      id: '1',
      name: 'Dynamic Warm-up',
      category: 'Conditioning',
      plannedDuration: 15,
      actualDuration: 18,
      status: 'completed',
      startTime: new Date('2024-09-25T16:05:00'),
      endTime: new Date('2024-09-25T16:23:00'),
      effectiveness: 8,
      notes: 'Good energy from the team',
      playerParticipation: 18,
      modifications: 'Extended hamstring stretches',
    },
    {
      id: '2',
      name: 'Passing Accuracy',
      category: 'Fundamentals',
      plannedDuration: 20,
      actualDuration: 22,
      status: 'completed',
      startTime: new Date('2024-09-25T16:25:00'),
      endTime: new Date('2024-09-25T16:47:00'),
      effectiveness: 9,
      notes: 'Excellent precision today',
      playerParticipation: 18,
      modifications: 'Added pressure scenarios',
    },
    {
      id: '3',
      name: 'Set Play Practice',
      category: 'Offense',
      plannedDuration: 25,
      actualDuration: null,
      status: 'in_progress',
      startTime: new Date('2024-09-25T16:50:00'),
      endTime: null,
      effectiveness: null,
      notes: '',
      playerParticipation: 17,
      modifications: '',
    },
    {
      id: '4',
      name: 'Defensive Positioning',
      category: 'Defense',
      plannedDuration: 20,
      actualDuration: null,
      status: 'scheduled',
      startTime: null,
      endTime: null,
      effectiveness: null,
      notes: '',
      playerParticipation: null,
      modifications: '',
    },
    {
      id: '5',
      name: 'Scrimmage',
      category: 'Game Situation',
      plannedDuration: 30,
      actualDuration: null,
      status: 'scheduled',
      startTime: null,
      endTime: null,
      effectiveness: null,
      notes: '',
      playerParticipation: null,
      modifications: '',
    },
  ],
  attendance: [
    {
      playerId: '1',
      playerName: 'Alex Johnson',
      status: 'present',
      arrivalTime: new Date('2024-09-25T15:55:00'),
    },
    {
      playerId: '2',
      playerName: 'Sarah Martinez',
      status: 'present',
      arrivalTime: new Date('2024-09-25T16:00:00'),
    },
    {
      playerId: '3',
      playerName: 'Marcus Davis',
      status: 'present',
      arrivalTime: new Date('2024-09-25T16:02:00'),
    },
    {
      playerId: '4',
      playerName: 'Emily Chen',
      status: 'late',
      arrivalTime: new Date('2024-09-25T16:15:00'),
    },
    {
      playerId: '5',
      playerName: 'Jake Thompson',
      status: 'absent',
      arrivalTime: null,
    },
    {
      playerId: '6',
      playerName: 'Lisa Park',
      status: 'present',
      arrivalTime: new Date('2024-09-25T15:58:00'),
    },
  ],
  stats: {
    totalDrills: 5,
    completedDrills: 2,
    totalPlannedTime: 90,
    actualTimeElapsed: 45,
    averageEffectiveness: 8.5,
    attendanceRate: 83,
  },
};

// Server function for getting session data
const getSessionData = createServerFn({ method: 'GET' })
  .inputValidator((sessionId: string) => sessionId)
  .handler(async ({ data: sessionId }) => mockSessionData);

// Server function for updating session
const updateSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; updates: any }) => data)
  .handler(async ({ data: { sessionId, updates } }) => ({ success: true }));

// Server function for permissions
const getSessionPermissions = createServerFn().handler(async () => ({
  canManageSession: true,
  canEditDrills: true,
  canRecordAttendance: true,
  canEndSession: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/practice/sessions/$sessionId'
)({
  component: PracticeSession,
  loader: async ({ params }) => {
    const [data, permissions] = await Promise.all([
      getSessionData({ data: params.sessionId }),
      getSessionPermissions(),
    ]);

    return { data, permissions };
  },
});

function PracticeSession() {
  const { organizationSlug } = Route.useParams();
  const { data, permissions } = Route.useLoaderData();
  const { session, drills, attendance, stats } = data;

  const [currentDrillId, setCurrentDrillId] = useState<string | null>(
    drills.find((d) => d.status === 'in_progress')?.id || null
  );

  const formatTime = (date: Date | null) => {
    if (!date) {
      return '--:--';
    }
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) {
      return '--';
    }
    return `${minutes}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'default';
      case 'scheduled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'default';
      case 'late':
        return 'destructive';
      case 'absent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSessionProgress = () =>
    Math.round((stats.completedDrills / stats.totalDrills) * 100);

  const handleStartDrill = async (drillId: string) => {
    // Update drill status to in_progress
    await updateSession({
      data: {
        sessionId: session.id,
        updates: {
          drillUpdates: {
            [drillId]: {
              status: 'in_progress',
              startTime: new Date(),
            },
          },
        },
      },
    });
    setCurrentDrillId(drillId);
  };

  const handleCompleteDrill = async (drillId: string) => {
    // Update drill status to completed
    await updateSession({
      data: {
        sessionId: session.id,
        updates: {
          drillUpdates: {
            [drillId]: {
              status: 'completed',
              endTime: new Date(),
            },
          },
        },
      },
    });
    setCurrentDrillId(null);
  };

  const handleEndSession = async () => {
    // End the practice session
    await updateSession({
      data: {
        sessionId: session.id,
        updates: {
          status: 'completed',
          actualEndTime: new Date(),
        },
      },
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild size="sm" variant="outline">
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/practice/schedule"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-3xl">{session.name}</h1>
            <p className="text-muted-foreground">
              {formatTime(session.actualStartTime || new Date(session.date))} •{' '}
              {session.location}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {session.status === 'in_progress' && permissions.canEndSession && (
            <Button onClick={handleEndSession} variant="destructive">
              <StopCircle className="mr-2 h-4 w-4" />
              End Session
            </Button>
          )}
          {permissions.canManageSession && (
            <Button disabled variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Session Overview */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Progress</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{getSessionProgress()}%</div>
            <p className="text-muted-foreground text-xs">
              {stats.completedDrills} of {stats.totalDrills} drills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Time Elapsed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.actualTimeElapsed}min
            </div>
            <p className="text-muted-foreground text-xs">
              of {stats.totalPlannedTime}min planned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.attendanceRate}%</div>
            <p className="text-muted-foreground text-xs">
              {attendance.filter((a) => a.status === 'present').length} present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Effectiveness</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.averageEffectiveness
                ? `${stats.averageEffectiveness}/10`
                : '--'}
            </div>
            <p className="text-muted-foreground text-xs">Average rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Drill Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Drill Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drills.map((drill) => (
                  <div
                    className={`rounded border p-4 ${
                      drill.id === currentDrillId ? 'ring-2 ring-primary' : ''
                    }`}
                    key={drill.id}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{drill.name}</h4>
                          <Badge variant={getStatusColor(drill.status)}>
                            {drill.status}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            {drill.category}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Planned:{' '}
                            </span>
                            {formatDuration(drill.plannedDuration)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Actual:{' '}
                            </span>
                            {formatDuration(drill.actualDuration)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Start:{' '}
                            </span>
                            {formatTime(drill.startTime)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">End: </span>
                            {formatTime(drill.endTime)}
                          </div>
                        </div>

                        {drill.effectiveness && (
                          <div className="mt-2">
                            <span className="text-muted-foreground text-sm">
                              Effectiveness:{' '}
                            </span>
                            <span className="font-medium">
                              {drill.effectiveness}/10
                            </span>
                          </div>
                        )}

                        {drill.modifications && (
                          <div className="mt-2">
                            <span className="text-muted-foreground text-sm">
                              Modifications:{' '}
                            </span>
                            <span className="text-sm">
                              {drill.modifications}
                            </span>
                          </div>
                        )}

                        {drill.notes && (
                          <div className="mt-2">
                            <span className="text-muted-foreground text-sm">
                              Notes:{' '}
                            </span>
                            <span className="text-sm">{drill.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {drill.status === 'scheduled' &&
                          permissions.canManageSession && (
                            <Button
                              onClick={() => handleStartDrill(drill.id)}
                              size="sm"
                            >
                              <Play className="mr-2 h-3 w-3" />
                              Start
                            </Button>
                          )}

                        {drill.status === 'in_progress' &&
                          permissions.canManageSession && (
                            <Button
                              onClick={() => handleCompleteDrill(drill.id)}
                              size="sm"
                            >
                              <CheckCircle className="mr-2 h-3 w-3" />
                              Complete
                            </Button>
                          )}

                        {permissions.canEditDrills && (
                          <Button disabled size="sm" variant="outline">
                            <Edit className="mr-2 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium">Objectives</h4>
                  <ul className="space-y-1 text-sm">
                    {session.objectives.map((objective) => (
                      <li className="flex items-start gap-2" key={objective}>
                        <span className="text-muted-foreground">•</span>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>

                {session.notes && (
                  <div>
                    <h4 className="mb-2 font-medium">Coach Notes</h4>
                    <p className="text-muted-foreground text-sm">
                      {session.notes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium">Weather</h4>
                    <p className="text-muted-foreground">
                      {session.weatherConditions}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Field</h4>
                    <p className="text-muted-foreground">
                      {session.fieldConditions}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendance.map((player) => (
                  <div
                    className="flex items-center justify-between"
                    key={player.playerId}
                  >
                    <span className="text-sm">{player.playerName}</span>
                    <div className="flex items-center gap-2">
                      {player.arrivalTime && (
                        <span className="text-muted-foreground text-xs">
                          {formatTime(player.arrivalTime)}
                        </span>
                      )}
                      <Badge
                        className="text-xs"
                        variant={getAttendanceColor(player.status)}
                      >
                        {player.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {permissions.canRecordAttendance && (
                <Button
                  className="mt-4 w-full"
                  disabled
                  size="sm"
                  variant="outline"
                >
                  Update Attendance
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{session.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Scheduled: {session.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {session.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                </div>
              </div>

              {session.status === 'in_progress' && (
                <div className="mt-4 rounded bg-muted p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    <span className="font-medium">Session in progress</span>
                  </div>
                  <div className="mt-1 text-muted-foreground text-xs">
                    Started at {formatTime(session.actualStartTime)}
                  </div>
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
              {permissions.canRecordAttendance && (
                <Button
                  className="w-full justify-start"
                  disabled
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Record Attendance
                </Button>
              )}

              <Button
                className="w-full justify-start"
                disabled
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Timer
              </Button>

              <Button
                className="w-full justify-start"
                disabled
                variant="outline"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause Session
              </Button>

              {permissions.canManageSession && (
                <Button
                  className="w-full justify-start"
                  disabled
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Add Notes
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
