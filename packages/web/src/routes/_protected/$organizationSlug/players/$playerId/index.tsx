import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Edit,
  FileText,
  GraduationCap,
  Phone,
  Plus,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";

// Mock data for player details
const mockPlayerDetails = {
  id: "1",
  userId: "user-1",
  name: "Alex Johnson",
  jerseyNumber: 23,
  primaryPosition: "attack",
  secondaryPositions: ["midfield"],
  gradeLevel: "junior",
  gpa: 3.7,
  height: "6'0\"",
  weight: "175 lbs",
  dominantHand: "right",
  academicStanding: "good",

  // Personal Information
  emergencyContactName: "Sarah Johnson (Mother)",
  emergencyContactPhone: "(555) 123-4567",
  seasonGoals:
    "Score 25 goals, improve shot accuracy to 75%, become team captain",
  collegeAspirations: "Division I lacrosse scholarship, study business",
  careerGoals: "Professional lacrosse player or sports management",

  // Equipment & Medical
  equipmentNeeds: "New helmet (medium), backup stick",
  medicalNotes: "Minor shoulder injury (cleared), allergic to ibuprofen",
  injuryHistory: "Sprained ankle (2023), minor concussion (2022)",

  // Development Summary
  overallRating: 7,
  potentialRating: 9,
  developmentTrend: "improving" as const,
  priorityLevel: "high" as const,

  // Season Statistics
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

  // Recent Development Activity
  recentNotes: [
    {
      id: "1",
      title: "Excellent leadership in practice",
      type: "behavior",
      date: new Date("2024-09-20"),
      priority: "medium" as const,
      coach: "Coach Johnson",
    },
    {
      id: "2",
      title: "Shot mechanics improvement",
      type: "skill_assessment",
      date: new Date("2024-09-18"),
      priority: "high" as const,
      coach: "Coach Smith",
    },
    {
      id: "3",
      title: "Academic check-in",
      type: "general",
      date: new Date("2024-09-15"),
      priority: "low" as const,
      coach: "Coach Johnson",
    },
  ],

  // Active Goals
  activeGoals: [
    {
      id: "1",
      title: "Improve Shot Accuracy",
      targetValue: "75% accuracy",
      currentValue: "62% accuracy",
      progress: 65,
      dueDate: new Date("2024-11-15"),
      category: "skill",
    },
    {
      id: "2",
      title: "Score 25 Goals This Season",
      targetValue: "25 goals",
      currentValue: "18 goals",
      progress: 72,
      dueDate: new Date("2024-11-30"),
      category: "team",
    },
    {
      id: "3",
      title: "Maintain 3.7+ GPA",
      targetValue: "3.7 GPA",
      currentValue: "3.7 GPA",
      progress: 100,
      dueDate: new Date("2024-12-15"),
      category: "academic",
    },
  ],

  // Assigned Resources
  assignedResources: [
    {
      id: "1",
      title: "Advanced Shooting Drills",
      type: "drill",
      status: "in_progress" as const,
      assignedDate: new Date("2024-09-15"),
      dueDate: new Date("2024-09-30"),
      priority: "high" as const,
    },
    {
      id: "2",
      title: "Leadership Skills Video Series",
      type: "video",
      status: "completed" as const,
      assignedDate: new Date("2024-09-10"),
      dueDate: new Date("2024-09-25"),
      priority: "medium" as const,
    },
    {
      id: "3",
      title: "NCAA Recruiting Rules Guide",
      type: "article",
      status: "not_started" as const,
      assignedDate: new Date("2024-09-22"),
      dueDate: new Date("2024-10-05"),
      priority: "medium" as const,
    },
  ],

  // Latest Skills Assessment
  latestAssessment: {
    date: new Date("2024-09-15"),
    assessedBy: "Coach Johnson",

    // Offensive Skills
    shootingAccuracy: 7,
    shootingPower: 6,
    dodgingAbility: 8,
    passingAccuracy: 8,
    ballHandling: 9,

    // Defensive Skills
    stickChecking: 5,
    bodyPositioning: 6,
    communication: 8,

    // Athletic Skills
    speed: 7,
    agility: 8,
    endurance: 7,
    strength: 6,

    // Mental Skills
    fieldAwareness: 9,
    decisionMaking: 8,
    leadership: 8,
    coachability: 9,

    strengths: "Excellent field vision, strong ball handling, natural leader",
    areasForImprovement: "Shot power, defensive positioning, physical strength",
  },

  // Upcoming Events
  nextMeetingDate: new Date("2024-09-25"),
  nextAssessmentDate: new Date("2024-10-15"),
};

// Server function for getting player details
const getPlayerDetails = createServerFn({ method: "GET" })
  .inputValidator((data: { playerId: string }) => data)
  .handler(({ data: _ }) => {
    // TODO: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@laxdb/core/player-development/index');
    // return await PlayerDevelopmentAPI.getPlayerProfile(data.playerId, headers);

    return mockPlayerDetails;
  });

// Server function for permissions
const getPlayerPermissions = createServerFn().handler(() => ({
  canEdit: true,
  canCreateNotes: true,
  canAssess: true,
  canAssignResources: true,
  canSetGoals: true,
  canViewSensitive: true,
}));

export const Route = createFileRoute(
  "/_protected/$organizationSlug/players/$playerId/",
)({
  component: PlayerDetailsPage,
  loader: async ({ params }) => {
    const [player, permissions] = await Promise.all([
      getPlayerDetails({ data: { playerId: params.playerId } }),
      getPlayerPermissions(),
    ]);

    return { player, permissions };
  },
});

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

const getTrendColor = (trend: string) => {
  switch (trend) {
    case "improving":
      return "default";
    case "stable":
      return "secondary";
    case "needs_attention":
      return "destructive";
    default:
      return "outline";
  }
};

const getTrendLabel = (trend: string) => {
  switch (trend) {
    case "improving":
      return "Improving";
    case "stable":
      return "Stable";
    case "needs_attention":
      return "Needs Attention";
    default:
      return trend;
  }
};

const getPriorityColor = (priority: "low" | "medium" | "high") => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "not_started":
      return "outline";
    default:
      return "outline";
  }
};

const getGoalCategoryIcon = (category: string) => {
  switch (category) {
    case "skill":
      return <Target className="h-4 w-4" />;
    case "academic":
      return <GraduationCap className="h-4 w-4" />;
    case "team":
      return <Trophy className="h-4 w-4" />;
    default:
      return <Star className="h-4 w-4" />;
  }
};

function PlayerDetailsPage() {
  const { organizationSlug } = Route.useParams();
  const { player, permissions } = Route.useLoaderData();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link params={{ organizationSlug }} to="/$organizationSlug/players">
          <Button className="mb-4" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Players
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xl">
              {player.jerseyNumber}
            </div>
            <div>
              <h1 className="font-bold text-3xl">{player.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>
                  {player.primaryPosition.charAt(0).toUpperCase() +
                    player.primaryPosition.slice(1)}
                </span>
                <span>•</span>
                <span>
                  {player.gradeLevel.charAt(0).toUpperCase() +
                    player.gradeLevel.slice(1)}
                </span>
                <span>•</span>
                <span>
                  {player.height}, {player.weight}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getTrendColor(player.developmentTrend)}>
              {getTrendLabel(player.developmentTrend)}
            </Badge>
            {permissions.canEdit && (
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link
                    params={{
                      organizationSlug,
                      playerId: player.id,
                    }}
                    to="/$organizationSlug/players/$playerId/edit"
                  />
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Season Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Season Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="font-bold text-2xl">{player.goals}</div>
                  <div className="text-muted-foreground text-sm">Goals</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl">{player.assists}</div>
                  <div className="text-muted-foreground text-sm">Assists</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl">
                    {player.shotAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Shot Accuracy
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{player.gamesPlayed}</div>
                  <div className="text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{player.groundBalls}</div>
                  <div className="text-muted-foreground">Ground Balls</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{player.causedTurnovers}</div>
                  <div className="text-muted-foreground">Caused TOs</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">
                    {player.minutesPlayed.toFixed(1)}
                  </div>
                  <div className="text-muted-foreground">Avg Minutes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Goals</CardTitle>
                {permissions.canSetGoals && (
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <Link
                        params={{ organizationSlug }}
                        search={{ playerId: player.id }}
                        to="/$organizationSlug/players/goals/create"
                      />
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Set Goal
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {player.activeGoals.length > 0 ? (
                <div className="space-y-4">
                  {player.activeGoals.map((goal) => (
                    <div className="rounded border p-3" key={goal.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getGoalCategoryIcon(goal.category)}
                          <span className="font-medium">{goal.title}</span>
                        </div>
                        <span className="font-bold text-sm">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="mb-2 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {goal.currentValue} → {goal.targetValue}
                        </span>
                        <span className="text-muted-foreground">
                          Due: {formatDate(goal.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Target className="mx-auto mb-2 h-8 w-8" />
                  <p>No active goals set</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Development Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Development Notes</CardTitle>
                {permissions.canCreateNotes && (
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <Link
                        params={{ organizationSlug }}
                        search={{ playerId: player.id }}
                        to="/$organizationSlug/players/notes/create"
                      />
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {player.recentNotes.length > 0 ? (
                <div className="space-y-3">
                  {player.recentNotes.map((note) => (
                    <div
                      className="flex items-center justify-between rounded border p-3"
                      key={note.id}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{note.title}</div>
                        <div className="text-muted-foreground text-xs">
                          by {note.coach} • {formatDate(note.date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(note.priority)}>
                          {note.priority}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          render={
                            <Link
                              params={{
                                organizationSlug,
                                playerId: player.id,
                              }}
                              to="/$organizationSlug/players/$playerId/notes"
                            />
                          }
                        >
                          View All
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8" />
                  <p>No development notes yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Player Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Player Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="font-bold text-lg">
                    {player.overallRating}/10
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Current Rating
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg">
                    {player.potentialRating}/10
                  </div>
                  <div className="text-muted-foreground text-xs">Potential</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>GPA:</span>
                  <span className="font-medium">{player.gpa}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dominant Hand:</span>
                  <span className="font-medium">{player.dominantHand}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Secondary Positions:</span>
                  <span className="font-medium">
                    {player.secondaryPositions.length > 0
                      ? player.secondaryPositions.join(", ")
                      : "None"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.canCreateNotes && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  render={
                    <Link
                      params={{ organizationSlug }}
                      search={{ playerId: player.id }}
                      to="/$organizationSlug/players/notes/create"
                    />
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Add Development Note
                </Button>
              )}

              {permissions.canAssess && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  render={
                    <Link
                      params={{ organizationSlug }}
                      search={{ playerId: player.id }}
                      to="/$organizationSlug/players/assessments/create"
                    />
                  }
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Create Assessment
                </Button>
              )}

              {permissions.canAssignResources && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  render={
                    <Link
                      params={{ organizationSlug }}
                      search={{ playerId: player.id }}
                      to="/$organizationSlug/players/resources/create"
                    />
                  }
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Assign Resource
                </Button>
              )}

              {permissions.canSetGoals && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  render={
                    <Link
                      params={{ organizationSlug }}
                      search={{ playerId: player.id }}
                      to="/$organizationSlug/players/goals/create"
                    />
                  }
                >
                  <Target className="mr-2 h-4 w-4" />
                  Set Goal
                </Button>
              )}

              <Button
                className="w-full justify-start"
                variant="outline"
                render={
                  <Link
                    params={{
                      organizationSlug,
                      playerId: player.id,
                    }}
                    to="/$organizationSlug/players/$playerId/stats"
                  />
                }
              >
                <Trophy className="mr-2 h-4 w-4" />
                Detailed Stats
              </Button>
            </CardContent>
          </Card>

          {/* Assigned Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Resources</CardTitle>
            </CardHeader>
            <CardContent>
              {player.assignedResources.length > 0 ? (
                <div className="space-y-2">
                  {player.assignedResources.slice(0, 3).map((resource) => (
                    <div
                      className="flex items-center justify-between text-sm"
                      key={resource.id}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{resource.title}</div>
                        <div className="text-muted-foreground text-xs">
                          Due: {formatDate(resource.dueDate)}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(resource.status)}>
                        {resource.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                  {player.assignedResources.length > 3 && (
                    <Button
                      className="w-full"
                      size="sm"
                      variant="ghost"
                      render={
                        <Link
                          params={{
                            organizationSlug,
                            playerId: player.id,
                          }}
                          to="/$organizationSlug/players/$playerId/resources"
                        />
                      }
                    >
                      View All ({player.assignedResources.length})
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm">
                  No resources assigned
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          {permissions.canViewSensitive && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {player.emergencyContactName && (
                  <div>
                    <div className="font-medium">Emergency Contact</div>
                    <div className="text-muted-foreground">
                      {player.emergencyContactName}
                    </div>
                  </div>
                )}
                {player.emergencyContactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      className="text-blue-600 hover:underline"
                      href={`tel:${player.emergencyContactPhone}`}
                    >
                      {player.emergencyContactPhone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {player.nextMeetingDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Next Meeting</div>
                    <div className="text-muted-foreground">
                      {formatDate(player.nextMeetingDate)}
                    </div>
                  </div>
                </div>
              )}
              {player.nextAssessmentDate && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Next Assessment</div>
                    <div className="text-muted-foreground">
                      {formatDate(player.nextAssessmentDate)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
