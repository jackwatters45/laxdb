import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { TeamService } from "@laxdb/core/team/team.service";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/sidebar/dashboard-header";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authMiddleware } from "@/lib/middleware";

const CreateTeamSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
});

const createTeam = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof CreateTeamSchema.Type) =>
    Schema.decodeSync(CreateTeamSchema)(data),
  )
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

export const Route = createFileRoute(
  "/_protected/$organizationSlug/teams/create",
)({
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

  // Use React Query mutation for team creation
  const createTeamMutation = useMutation({
    mutationKey: ["createTeam"],
    mutationFn: (data: FormData) => createTeam({ data }),
    onSuccess: (_, variables) => {
      toast.success(`Team "${variables.name}" created successfully!`);
      // Invalidate router cache to ensure fresh data and navigate back
      router.invalidate();
      router.navigate({
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
    createTeamMutation.mutate(data);
  };

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
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild title="Create">
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/teams/create"
            >
              Create
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </DashboardHeader>
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="font-bold text-3xl">Create New Team</h1>
          <p className="text-muted-foreground">
            Add a new team to your organization
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., U18s, Senior Men's A, Women's Team"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the team..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    asChild
                    className="flex-1"
                    type="button"
                    variant="outline"
                  >
                    <Link params={{ organizationSlug }} to="/$organizationSlug">
                      Cancel
                    </Link>
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={createTeamMutation.isPending}
                    type="submit"
                  >
                    {createTeamMutation.isPending
                      ? "Creating..."
                      : "Create Team"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
