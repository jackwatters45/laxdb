import { Link } from "@tanstack/react-router";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import type { PlayerDetails } from "../-utils";
import { formatDate, getStatusColor } from "../-utils";

type AssignedResourcesProps = {
  player: PlayerDetails;
  organizationSlug: string;
};

export function AssignedResources({
  player,
  organizationSlug,
}: AssignedResourcesProps) {
  return (
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
  );
}
