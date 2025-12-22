import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Calendar, FileText, Plus, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for player notes
const mockPlayerNotes = [
  {
    id: '1',
    title: 'Excellent leadership in practice',
    content:
      "Alex showed outstanding leadership during today's scrimmage. He effectively communicated with teammates, made smart decisions under pressure, and helped organize the offense when plays broke down.",
    type: 'behavior',
    date: new Date('2024-09-20'),
    priority: 'medium' as const,
    coach: 'Coach Johnson',
    tags: ['leadership', 'communication', 'game-sense'],
  },
  {
    id: '2',
    title: 'Shot mechanics improvement needed',
    content:
      "While Alex's shot accuracy has improved to 62%, his mechanics still need work. His follow-through is inconsistent and he tends to rush shots when under pressure. Recommend additional one-on-one shooting sessions.",
    type: 'skill_assessment',
    date: new Date('2024-09-18'),
    priority: 'high' as const,
    coach: 'Coach Smith',
    tags: ['shooting', 'mechanics', 'accuracy'],
  },
  {
    id: '3',
    title: 'Academic check-in - positive progress',
    content:
      "Met with Alex about his academic performance. Current GPA is 3.7, up from 3.5 last semester. He's staying on top of assignments and has good study habits. Continue to monitor but no concerns at this time.",
    type: 'general',
    date: new Date('2024-09-15'),
    priority: 'low' as const,
    coach: 'Coach Johnson',
    tags: ['academics', 'progress'],
  },
  {
    id: '4',
    title: 'Injury update - shoulder cleared',
    content:
      'Alex was cleared by the trainer for full contact. Shoulder injury from last month has healed completely. No restrictions on practice or game participation.',
    type: 'medical',
    date: new Date('2024-09-12'),
    priority: 'medium' as const,
    coach: 'Athletic Trainer Davis',
    tags: ['injury', 'medical', 'cleared'],
  },
];

const getPlayerNotes = createServerFn({ method: 'GET' })
  .inputValidator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    return {
      playerName: 'Alex Johnson',
      notes: mockPlayerNotes,
    };
  });

const getPlayerPermissions = createServerFn().handler(async () => ({
  canCreateNotes: true,
  canEditNotes: true,
  canDeleteNotes: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/players/$playerId/notes'
)({
  component: PlayerNotesPage,
  loader: async ({ params }) => {
    const [playerData, permissions] = await Promise.all([
      getPlayerNotes({ data: { playerId: params.playerId } }),
      getPlayerPermissions(),
    ]);

    return { ...playerData, permissions };
  },
});

function PlayerNotesPage() {
  const { playerName, notes, permissions } = Route.useLoaderData();
  const { organizationSlug, playerId } = Route.useParams();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavior':
        return <User className="h-4 w-4" />;
      case 'skill_assessment':
        return <FileText className="h-4 w-4" />;
      case 'medical':
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
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
            <h1 className="font-bold text-3xl">Development Notes</h1>
            <p className="text-muted-foreground">
              Track progress and observations for {playerName}
            </p>
          </div>

          {permissions.canCreateNotes && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                search={{ playerId }}
                to="/$organizationSlug/players/notes/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Link>
            </Button>
          )}
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-6">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(note.type)}
                    <div>
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span>by {note.coach}</span>
                        <span>•</span>
                        <span>{formatDate(note.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(note.priority)}>
                      {note.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {note.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm leading-relaxed">{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <Badge className="text-xs" key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">No notes yet</h2>
          <p className="mb-6 text-muted-foreground">
            Development notes will appear here when added
          </p>
          {permissions.canCreateNotes && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                search={{ playerId }}
                to="/$organizationSlug/players/notes/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Note
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
