import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { TeamService } from "@laxdb/core/team/team.service";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@laxdb/ui/components/ui/breadcrumb";
import { Button } from "@laxdb/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@laxdb/ui/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DashboardHeader } from "@/components/sidebar/dashboard-header";
import { authMiddleware } from "@/lib/middleware";

const CreateTeamSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
});

const createTeam = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof CreateTeamSchema.Type) => Schema.decodeSync(CreateTeamSchema)(data))
  .handler(({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const teamService = yield* TeamService;
        return yield* teamService.createTeam(data, context.headers);
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

export const Route = createFileRoute("/_protected/$organizationSlug/teams/create")({
  component: CreateTeamPage,
});

function CreateTeamPage() {
  const { organizationSlug } = Route.useParams();

  const router = useRouter();

  const form = useForm<FormData>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createTeamMutation = useMutation({
    mutationKey: ["createTeam"],
    mutationFn: (data: FormData) => createTeam({ data }),
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
    onError: () => {
      toast.error("Failed to create team. Please try again.");
    },
  });

  const onSubmit = (data: FormData) => {
    createTeamMutation.mutate(data);
  };

  return (
    <>
      <DashboardHeader>
        <BreadcrumbItem>
          <BreadcrumbLink
            title="Teams"
            render={<Link params={{ organizationSlug }} to="/$organizationSlug" />}
          >
            Teams
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            title="Create"
            render={<Link params={{ organizationSlug }} to="/$organizationSlug/teams/create" />}
          >
            Create
          </BreadcrumbLink>
        </BreadcrumbItem>
      </DashboardHeader>
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Team</h1>
          <p className="text-muted-foreground">Add a new team to your organization</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="team-name">Team Name</FieldLabel>
                      <Input
                        {...field}
                        id="team-name"
                        placeholder="e.g., U18s, Senior Men's A, Women's Team"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="team-description">Description (Optional)</FieldLabel>
                      <Textarea
                        {...field}
                        id="team-description"
                        placeholder="Brief description of the team..."
                        rows={3}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1"
                  type="button"
                  variant="outline"
                  render={<Link params={{ organizationSlug }} to="/$organizationSlug" />}
                >
                  Cancel
                </Button>
                <Button className="flex-1" disabled={createTeamMutation.isPending} type="submit">
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
