import { Link } from '@tanstack/react-router';
import { FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlayerDetails } from '../-utils';
import { formatDate, getPriorityColor } from '../-utils';

type RecentNotesProps = {
  player: PlayerDetails;
  organizationSlug: string;
  canCreateNotes: boolean;
};

export function RecentNotes({
  player,
  organizationSlug,
  canCreateNotes,
}: RecentNotesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Development Notes</CardTitle>
          {canCreateNotes && (
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug }}
                search={{ playerId: player.id }}
                to="/$organizationSlug/players/notes/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Link>
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
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      params={{
                        organizationSlug,
                        playerId: player.id,
                      }}
                      to="/$organizationSlug/players/$playerId/notes"
                    >
                      View All
                    </Link>
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
  );
}
