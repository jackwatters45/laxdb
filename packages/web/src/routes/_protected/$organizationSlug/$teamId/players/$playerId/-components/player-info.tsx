import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Edit } from "lucide-react";
import React from "react";

import type { PlayerInfoType } from "../-data-2";

type PlayerInfoProps = {
  organizationSlug: string;
  teamId: string;
  canEdit: boolean;
  playerInfo: PlayerInfoType;
};

export function PlayerInfo({ organizationSlug, teamId, canEdit, playerInfo }: PlayerInfoProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold">{playerInfo.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {[
                playerInfo.primaryPosition
                  ? {
                      key: "position",
                      content: <span className="capitalize">{playerInfo.primaryPosition}</span>,
                    }
                  : null,
                playerInfo.gradeLevel
                  ? {
                      key: "grade",
                      content: <span className="capitalize">{playerInfo.gradeLevel}</span>,
                    }
                  : null,
                playerInfo.heightFeet && playerInfo.heightInches
                  ? {
                      key: "height",
                      content: (
                        <span>
                          {playerInfo.heightFeet}&apos;
                          {playerInfo.heightInches}&quot;
                        </span>
                      ),
                    }
                  : null,
                playerInfo.weightPounds
                  ? {
                      key: "weight",
                      content: <span>{playerInfo.weightPounds} lbs</span>,
                    }
                  : null,
              ]
                .filter((item) => item !== null)
                .map((item, index, arr) => (
                  <React.Fragment key={item.key}>
                    {item.content}
                    {index < arr.length - 1 && <span>•</span>}
                  </React.Fragment>
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {playerInfo.developmentTrend && (
            <Badge className="capitalize">{playerInfo.developmentTrend}</Badge>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              render={
                <Link
                  params={{
                    organizationSlug,
                    teamId,
                    playerId: playerInfo.id,
                  }}
                  to="/$organizationSlug/$teamId/players/$playerId/edit"
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
  );
}
