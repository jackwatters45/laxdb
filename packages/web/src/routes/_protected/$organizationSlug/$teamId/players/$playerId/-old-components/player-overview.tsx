import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlayerDetails } from '../-utils';

type PlayerOverviewProps = {
  player: PlayerDetails;
};

export function PlayerOverview({ player }: PlayerOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="font-bold text-lg">{player.overallRating}/10</div>
            <div className="text-muted-foreground text-xs">Current Rating</div>
          </div>
          <div>
            <div className="font-bold text-lg">{player.potentialRating}/10</div>
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
                ? player.secondaryPositions.join(', ')
                : 'None'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
