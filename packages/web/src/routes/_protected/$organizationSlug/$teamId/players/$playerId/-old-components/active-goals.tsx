import { Link } from '@tanstack/react-router';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlayerDetails } from '../-utils';
import { formatDate, getGoalCategoryIcon } from '../-utils';

type ActiveGoalsProps = {
  player: PlayerDetails;
  organizationSlug: string;
  canSetGoals: boolean;
};

export function ActiveGoals({
  player,
  organizationSlug,
  canSetGoals,
}: ActiveGoalsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Goals</CardTitle>
          {canSetGoals && (
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug }}
                search={{ playerId: player.id }}
                to="/$organizationSlug/players/goals/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Set Goal
              </Link>
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
                  <span className="font-bold text-sm">{goal.progress}%</span>
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
  );
}
