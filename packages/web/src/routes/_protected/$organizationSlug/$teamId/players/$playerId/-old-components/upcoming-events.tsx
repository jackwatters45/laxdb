import { Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlayerDetails } from '../-utils';
import { formatDate } from '../-utils';

type UpcomingEventsProps = {
  player: PlayerDetails;
};

export function UpcomingEvents({ player }: UpcomingEventsProps) {
  const hasEvents = player.nextMeetingDate || player.nextAssessmentDate;

  if (!hasEvents) {
    return null;
  }

  return (
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
  );
}
