import { Link } from '@tanstack/react-router';
import { BookOpen, FileText, Target, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type QuickActionsProps = {
  playerId: string;
  organizationSlug: string;
  permissions: {
    canCreateNotes: boolean;
    canAssess: boolean;
    canAssignResources: boolean;
    canSetGoals: boolean;
  };
};

export function QuickActions({
  playerId,
  organizationSlug,
  permissions,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {permissions.canCreateNotes && (
          <Button asChild className="w-full justify-start" variant="outline">
            <Link
              params={{ organizationSlug }}
              search={{ playerId }}
              to="/$organizationSlug/players/notes/create"
            >
              <FileText className="mr-2 h-4 w-4" />
              Add Development Note
            </Link>
          </Button>
        )}

        {permissions.canAssess && (
          <Button asChild className="w-full justify-start" variant="outline">
            <Link
              params={{ organizationSlug }}
              search={{ playerId }}
              to="/$organizationSlug/players/assessments/create"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Create Assessment
            </Link>
          </Button>
        )}

        {permissions.canAssignResources && (
          <Button asChild className="w-full justify-start" variant="outline">
            <Link
              params={{ organizationSlug }}
              search={{ playerId }}
              to="/$organizationSlug/players/resources/create"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Assign Resource
            </Link>
          </Button>
        )}

        {permissions.canSetGoals && (
          <Button asChild className="w-full justify-start" variant="outline">
            <Link
              params={{ organizationSlug }}
              search={{ playerId }}
              to="/$organizationSlug/players/goals/create"
            >
              <Target className="mr-2 h-4 w-4" />
              Set Goal
            </Link>
          </Button>
        )}

        <Button asChild className="w-full justify-start" variant="outline">
          <Link
            params={{
              organizationSlug,
              playerId,
            }}
            to="/$organizationSlug/players/$playerId/stats"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Detailed Stats
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
