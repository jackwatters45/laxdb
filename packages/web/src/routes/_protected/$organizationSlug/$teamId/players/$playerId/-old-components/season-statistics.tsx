import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";

import type { PlayerDetails } from "../-utils";

type SeasonStatisticsProps = {
  player: PlayerDetails;
};

export function SeasonStatistics({ player }: SeasonStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{player.goals}</div>
            <div className="text-sm text-muted-foreground">Goals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{player.assists}</div>
            <div className="text-sm text-muted-foreground">Assists</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {player.shotAccuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Shot Accuracy</div>
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
            <div className="font-medium">{player.minutesPlayed.toFixed(1)}</div>
            <div className="text-muted-foreground">Avg Minutes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
