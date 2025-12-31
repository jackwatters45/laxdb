import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { TeamService } from "@laxdb/core/team/team.service";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { Team } from "better-auth/plugins";
import { Effect, Schema } from "effect";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/sidebar/dashboard-header";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@laxdb/ui/components/ui/breadcrumb";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Field, FieldError, FieldLabel } from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { authMiddleware } from "@/lib/middleware";
import { getUserOrganizationContext } from "@/query/organizations";

const UpdateTeamSchema = Schema.Struct({
  teamId: Schema.String,
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
});

const updateTeam = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof UpdateTeamSchema.Type) =>
    Schema.decodeSync(UpdateTeamSchema)(data),
  )
  .handler(({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const teamService = yield* TeamService;
        return yield* teamService.updateTeam(data, context.headers);
      }),
    ),
  );

const formSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Team name is required" }),
    Schema.minLength(2, {
      message: () => "Team name must be at least 2 characters",
    }),
    Schema.maxLength(100, {
      message: () => "Team name must be less than 100 characters",
    }),
  ),
  description: Schema.optional(
    Schema.String.pipe(
      Schema.maxLength(500, {
        message: () => "Description must be less than 500 characters",
      }),
    ),
  ),
});

type FormData = typeof formSchema.Type;

export const Route = createFileRoute(
  "/_protected/$organizationSlug/$teamId/setup",
)({
  component: SetupTeamPage,
  loader: async () => {
    const { teams } = await getUserOrganizationContext();
    return { teams };
  },
});

function SetupTeamPage() {
  const { organizationSlug, teamId } = Route.useParams();
  const { teams } = Route.useLoaderData();
  const router = useRouter();

  const team = teams?.find((t: Team) => t.id === teamId);

  const form = useForm<FormData>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: team?.name ?? "",
      description: "",
    },
  });

  const updateTeamMutation = useMutation({
    mutationKey: ["updateTeam", teamId],
    mutationFn: (data: FormData) => updateTeam({ data: { teamId, ...data } }),
    onSuccess: async (_, variables) => {
      toast.success(`Team "${variables.name}" created successfully!`);
      await router.invalidate();
      await router.navigate({
        to: "/$organizationSlug",
        params: {
          organizationSlug,
        },
      });
    },
    onError: (_error) => {
      toast.error("Failed to create team. Please try again.");
    },
  });

  const onSubmit = (data: FormData) => {
    updateTeamMutation.mutate(data);
  };

  if (!team) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <p>Team not found</p>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader>
        <BreadcrumbItem>
          <BreadcrumbLink
            title="Teams"
            render={
              <Link params={{ organizationSlug }} to="/$organizationSlug" />
            }
          >
            Teams
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            title={team.name}
            render={
              <Link
                params={{ organizationSlug, teamId }}
                to="/$organizationSlug/$teamId"
              />
            }
          >
            {team.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            title="Setup"
            render={
              <Link
                params={{ organizationSlug, teamId }}
                to="/$organizationSlug/$teamId/setup"
              />
            }
          >
            Setup
          </BreadcrumbLink>
        </BreadcrumbItem>
      </DashboardHeader>
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="font-bold text-3xl">Create Your First Team</h1>
          <p className="text-muted-foreground">
            Give your team a unique name that reflects its identity
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Team Name</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      placeholder="e.g., U18s, Senior Men's A, Women's Team"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="description">
                      Description (Optional)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="description"
                      placeholder="Brief description of the team..."
                      rows={3}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1"
                  type="button"
                  variant="outline"
                  render={
                    <Link
                      params={{ organizationSlug }}
                      to="/$organizationSlug"
                    />
                  }
                >
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  disabled={updateTeamMutation.isPending}
                  type="submit"
                >
                  {updateTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
