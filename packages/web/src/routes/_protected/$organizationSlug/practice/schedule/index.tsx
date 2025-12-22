import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for practice schedule
const mockScheduleData = {
  practices: [
    {
      id: '1',
      name: 'Pre-Game Prep',
      date: new Date('2024-09-25'),
      time: '16:00',
      duration: 90,
      location: 'Main Field',
      drillCount: 8,
      attendanceExpected: 18,
      focus: ['Shooting', 'Set Plays'],
      status: 'scheduled',
      templateUsed: 'Game Prep Template',
      notes: 'Focus on execution under pressure',
    },
    {
      id: '2',
      name: 'Fundamentals Focus',
      date: new Date('2024-09-27'),
      time: '17:30',
      duration: 120,
      location: 'Practice Field',
      drillCount: 12,
      attendanceExpected: 20,
      focus: ['Passing', 'Ground Balls'],
      status: 'scheduled',
      templateUsed: null,
      notes: 'Emphasize technique over speed',
    },
    {
      id: '3',
      name: 'Conditioning & Skills',
      date: new Date('2024-09-29'),
      time: '16:00',
      duration: 105,
      location: 'Main Field',
      drillCount: 10,
      attendanceExpected: 17,
      focus: ['Conditioning', 'Defense'],
      status: 'scheduled',
      templateUsed: 'Conditioning Template',
      notes: 'Build endurance for playoffs',
    },
    {
      id: '4',
      name: 'Light Practice',
      date: new Date('2024-09-22'),
      time: '15:30',
      duration: 75,
      location: 'Practice Field',
      drillCount: 6,
      attendanceExpected: 16,
      focus: ['Recovery', 'Fundamentals'],
      status: 'completed',
      templateUsed: null,
      notes: 'Good energy from the team',
    },
    {
      id: '5',
      name: 'Game Simulation',
      date: new Date('2024-09-20'),
      time: '17:00',
      duration: 135,
      location: 'Main Field',
      drillCount: 15,
      attendanceExpected: 19,
      focus: ['Scrimmage', 'Game Situations'],
      status: 'completed',
      templateUsed: 'Scrimmage Template',
      notes: 'Excellent defensive performance',
    },
  ],
  currentWeek: {
    start: new Date('2024-09-23'),
    end: new Date('2024-09-29'),
  },
  stats: {
    practicesThisWeek: 3,
    totalHours: 315,
    averageAttendance: 17,
    templatesUsed: 2,
  },
};

// Server function for getting schedule data
const getScheduleData = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { PracticeAPI } = await import('@laxdb/core/practice/schedule');
  // const request = getRequest();
  // return await PracticeAPI.getSchedule(teamId, weekStart, request.headers);

  return mockScheduleData;
});

// Server function for permissions
const getSchedulePermissions = createServerFn().handler(async () => ({
  canSchedulePractices: true,
  canEditPractices: true,
  canCancelPractices: true,
  canViewAttendance: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/practice/schedule/'
)({
  component: PracticeSchedule,
  loader: async () => {
    const [data, permissions] = await Promise.all([
      getScheduleData(),
      getSchedulePermissions(),
    ]);

    return { data, permissions };
  },
});

function PracticeSchedule() {
  const { organizationSlug } = Route.useParams();
  const { data, permissions } = Route.useLoaderData();
  const [currentWeek, setCurrentWeek] = useState(data.currentWeek.start);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours!, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getPracticesForDate = (date: Date) =>
    data.practices.filter((practice) => {
      const practiceDate = new Date(practice.date);
      return practiceDate.toDateString() === date.toDateString();
    });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const weekDays = getWeekDays(currentWeek);
  const today = new Date();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Practice Schedule</h1>
          <p className="text-muted-foreground">
            Manage your team's practice calendar
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/practice"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          {permissions.canSchedulePractices && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/practice/schedule/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Schedule Practice
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigateWeek('prev')}
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="font-semibold">
                  {currentWeek.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  -{' '}
                  {new Date(
                    currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-muted-foreground text-sm">
                  {data.stats.practicesThisWeek} practices scheduled
                </div>
              </div>
              <Button
                onClick={() => navigateWeek('next')}
                size="sm"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setCurrentWeek(new Date())}
              size="sm"
              variant="outline"
            >
              Today
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <div className="mb-6 grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const practices = getPracticesForDate(day);
          const isToday = day.toDateString() === today.toDateString();
          const isPast = day < today && !isToday;

          return (
            <Card
              className={`min-h-[200px] ${isToday ? 'ring-2 ring-primary' : ''}`}
              key={day.getTime()}
            >
              <CardHeader className="pb-3">
                <div className="text-center">
                  <div
                    className={`font-semibold ${isToday ? 'text-primary' : isPast ? 'text-muted-foreground' : ''}`}
                  >
                    {formatDate(day)}
                  </div>
                  {isToday && (
                    <Badge className="mt-1 text-xs" variant="default">
                      Today
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {practices.map((practice) => (
                    <div
                      className={`cursor-pointer rounded border p-2 hover:bg-muted/50 ${
                        isPast ? 'opacity-60' : ''
                      }`}
                      key={practice.id}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          {practice.name}
                        </div>
                        <Badge
                          className="text-xs"
                          variant={getStatusColor(practice.status)}
                        >
                          {practice.status}
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-1 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(practice.time)} ({practice.duration}min)
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {practice.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {practice.attendanceExpected} expected
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {practice.focus.slice(0, 2).map((focus) => (
                          <Badge
                            className="text-xs"
                            key={focus}
                            variant="outline"
                          >
                            {focus}
                          </Badge>
                        ))}
                        {practice.focus.length > 2 && (
                          <Badge className="text-xs" variant="outline">
                            +{practice.focus.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {practices.length === 0 && (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                      No practices scheduled
                    </div>
                  )}

                  {permissions.canSchedulePractices &&
                    practices.length === 0 && (
                      <Button
                        className="w-full border border-dashed"
                        disabled
                        size="sm"
                        variant="ghost"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Practice
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Practices List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.practices
              .filter(
                (practice) =>
                  new Date(practice.date) >= today &&
                  practice.status === 'scheduled'
              )
              .slice(0, 5)
              .map((practice) => (
                <div
                  className="flex items-center justify-between rounded border p-3"
                  key={practice.id}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{practice.name}</span>
                      {practice.templateUsed && (
                        <Badge className="text-xs" variant="outline">
                          Template: {practice.templateUsed}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-muted-foreground text-sm">
                      {formatDate(new Date(practice.date))} at{' '}
                      {formatTime(practice.time)} • {practice.location}
                    </div>
                    {practice.notes && (
                      <div className="mt-1 text-muted-foreground text-xs">
                        {practice.notes}
                      </div>
                    )}
                    <div className="mt-2 flex gap-1">
                      {practice.focus.map((focus) => (
                        <Badge
                          className="text-xs"
                          key={focus}
                          variant="secondary"
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
                    <div className="text-center">
                      <div className="font-bold">
                        {practice.attendanceExpected}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Expected
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {permissions.canEditPractices && (
                        <Button disabled size="sm" variant="ghost">
                          Edit
                        </Button>
                      )}
                      <Button disabled size="sm" variant="ghost">
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {data.practices.filter(
            (practice) =>
              new Date(practice.date) >= today &&
              practice.status === 'scheduled'
          ).length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 font-semibold">No upcoming practices</h3>
              <p className="mb-4 text-sm">
                Schedule your next practice session to keep the team sharp.
              </p>
              {permissions.canSchedulePractices && (
                <Button disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Practice
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
