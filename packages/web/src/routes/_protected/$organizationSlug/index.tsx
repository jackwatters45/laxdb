import { RuntimeServer } from "@laxdb/core/runtime.server";
import { TeamIdSchema } from "@laxdb/core/schema";
import { TeamService } from "@laxdb/core/team/team.service";
import {
  createFileRoute,
  Link,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { Team, TeamMember } from "better-auth/plugins";
import { Effect, Schema } from "effect";
import { ArrowRight, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/sidebar/dashboard-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authMiddleware } from "@/lib/middleware";
import { getUserOrganizationContext } from "@/query/organizations";

const DeleteTeamSchema = Schema.Struct({
  ...TeamIdSchema,
});

const deleteTeam = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof DeleteTeamSchema.Type) =>
    Schema.decodeSync(DeleteTeamSchema)(data),
  )
  .handler(({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const teamService = yield* TeamService;
        return yield* teamService.deleteTeam(data, context.headers);
      }),
    ),
  );

export const Route = createFileRoute("/_protected/$organizationSlug/")({
  component: TeamsOverviewPage,
  loader: () => getUserOrganizationContext(),
});

function TeamsOverviewPage() {
  const { organizationSlug } = Route.useParams();
  const { teams, canManageTeams } = Route.useLoaderData();
  const { activeOrganization } = useRouteContext({
    from: "/_protected/$organizationSlug",
  });

  return (
    <>
      <DashboardHeader>
        <BreadcrumbItem>
          <BreadcrumbLink asChild title="Teams">
            <Link params={{ organizationSlug }} to="/$organizationSlug">
              Teams
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </DashboardHeader>
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Teams</h1>
            <p className="text-muted-foreground">
              Manage teams for {activeOrganization.name}
            </p>
          </div>

          {canManageTeams && (
            <Button asChild>
              <Link
                params={{ organizationSlug }}
                to="/$organizationSlug/teams/create"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Link>
            </Button>
          )}
        </div>

        {teams && teams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamOverviewCard
                canManage={canManageTeams}
                key={team.id}
                team={team}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 font-semibold text-xl">No teams yet</h2>
            <p className="mb-6 text-muted-foreground">
              Get started by creating your first team
            </p>
            {canManageTeams && (
              <Button asChild>
                <Link to="/organizations/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function TeamOverviewCard({
  team,
  canManage,
}: {
  team: Team & { members: TeamMember[] };
  canManage: boolean;
}) {
  const { organizationSlug } = Route.useParams();

  const router = useRouter();
  const memberCount = team.members.length;

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam({
        data: { teamId: team.id },
      });

      toast.success(`Team "${team.name}" deleted successfully.`);
      router.invalidate(); // Refresh the route data
    } catch (error) {
      toast.error(`Failed to delete team. Please try again. ${error}`);
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          {canManage && (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="text-destructive hover:text-destructive"
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Team</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{team.name}&quot;?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteTeam}
                    >
                      Delete Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {memberCount} members
            </span>
          </div>

          <Badge variant="secondary">Active</Badge>
        </div>

        <div className="space-y-2">
          <Link
            params={{
              organizationSlug,
              teamId: team.id,
            }}
            to="/$organizationSlug/$teamId"
          >
            <Button className="w-full" size="sm" variant="outline">
              Manage Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
