import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, BookOpen, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock resources data
const mockPlayerResources = [
  {
    id: '1',
    title: 'Advanced Shooting Drills',
    description:
      'Comprehensive shooting technique improvement exercises focusing on accuracy and power.',
    type: 'drill',
    status: 'in_progress' as const,
    assignedDate: new Date('2024-09-15'),
    dueDate: new Date('2024-09-30'),
    priority: 'high' as const,
    assignedBy: 'Coach Smith',
    progress: 65,
  },
  {
    id: '2',
    title: 'Leadership Skills Video Series',
    description:
      'Video series on developing leadership qualities and communication skills on the field.',
    type: 'video',
    status: 'completed' as const,
    assignedDate: new Date('2024-09-10'),
    dueDate: new Date('2024-09-25'),
    priority: 'medium' as const,
    assignedBy: 'Coach Johnson',
    progress: 100,
    completedDate: new Date('2024-09-23'),
  },
  {
    id: '3',
    title: 'NCAA Recruiting Rules Guide',
    description:
      'Important information about NCAA recruiting regulations and compliance requirements.',
    type: 'article',
    status: 'not_started' as const,
    assignedDate: new Date('2024-09-22'),
    dueDate: new Date('2024-10-05'),
    priority: 'medium' as const,
    assignedBy: 'Coach Johnson',
    progress: 0,
  },
  {
    id: '4',
    title: 'Conditioning Program - Fall Phase',
    description:
      'Personalized conditioning program to improve speed, agility, and endurance for the fall season.',
    type: 'program',
    status: 'in_progress' as const,
    assignedDate: new Date('2024-09-01'),
    dueDate: new Date('2024-11-15'),
    priority: 'high' as const,
    assignedBy: 'Trainer Davis',
    progress: 40,
  },
];

const getPlayerResources = createServerFn({ method: 'GET' })
  .inputValidator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    return {
      playerName: 'Alex Johnson',
      resources: mockPlayerResources,
    };
  });

const getPlayerPermissions = createServerFn().handler(async () => ({
  canAssignResources: true,
  canEditResources: true,
  canDeleteResources: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/players/$playerId/resources'
)({
  component: PlayerResourcesPage,
  loader: async ({ params }) => {
    const [playerData, permissions] = await Promise.all([
      getPlayerResources({ data: { playerId: params.playerId } }),
      getPlayerPermissions(),
    ]);

    return { ...playerData, permissions };
  },
});

function PlayerResourcesPage() {
  const { playerName, resources, permissions } = Route.useLoaderData();
  const { organizationSlug, playerId } = Route.useParams();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'not_started':
        return 'outline';
      default:
        return 'outline';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drill':
        return '🏃';
      case 'video':
        return '📹';
      case 'article':
        return '📖';
      case 'program':
        return '📋';
      default:
        return '📄';
    }
  };

  const groupedResources = {
    active: resources.filter(
      (r) => r.status === 'in_progress' || r.status === 'not_started'
    ),
    completed: resources.filter((r) => r.status === 'completed'),
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link
          params={{ organizationSlug, playerId }}
          to="/$organizationSlug/players/$playerId"
        >
          <Button className="mb-4" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {playerName}
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Assigned Resources</h1>
            <p className="text-muted-foreground">
              Learning materials and development resources for {playerName}
            </p>
          </div>

          {permissions.canAssignResources && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                search={{ playerId }}
                to="/$organizationSlug/players/resources/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign Resource
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Active Resources */}
      {groupedResources.active.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-xl">Active Resources</h2>
          <div className="space-y-4">
            {groupedResources.active.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getTypeIcon(resource.type)}
                      </span>
                      <div>
                        <CardTitle className="text-lg">
                          {resource.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <span>Assigned by {resource.assignedBy}</span>
                          <span>•</span>
                          <span>{formatDate(resource.assignedDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(resource.priority)}>
                        {resource.priority.toUpperCase()}
                      </Badge>
                      <Badge variant={getStatusColor(resource.status)}>
                        {resource.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground text-sm">
                    {resource.description}
                  </p>

                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{resource.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${resource.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {formatDate(resource.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-xs uppercase tracking-wide">
                        {resource.type}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Resources */}
      {groupedResources.completed.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-xl">Completed Resources</h2>
          <div className="space-y-3">
            {groupedResources.completed.map((resource) => (
              <Card className="opacity-75" key={resource.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {getTypeIcon(resource.type)}
                      </span>
                      <div>
                        <div className="font-medium">{resource.title}</div>
                        <div className="text-muted-foreground text-sm">
                          Completed{' '}
                          {resource.completedDate &&
                            formatDate(resource.completedDate)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default">COMPLETED</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {resources.length === 0 && (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">No resources assigned</h2>
          <p className="mb-6 text-muted-foreground">
            Learning resources will appear here when assigned
          </p>
          {permissions.canAssignResources && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                search={{ playerId }}
                to="/$organizationSlug/players/resources/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign First Resource
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
