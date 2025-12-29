import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Schema } from "effect";
import { ArrowLeft, Calendar, Target } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { Textarea } from "@laxdb/ui/components/ui/textarea";

// Form schema
const goalFormSchema = Schema.Struct({
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
    Schema.maxLength(100, {
      message: () => "Title must be less than 100 characters",
    }),
  ),
  description: Schema.optional(Schema.String),
  category: Schema.Literal("skill", "academic", "team", "personal"),
  currentValue: Schema.optional(Schema.String),
  targetValue: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Target value is required" }),
  ),
  dueDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Due date is required" }),
  ),
  priority: Schema.Literal("low", "medium", "high"),
});

type GoalFormValues = typeof goalFormSchema.Type;

// Server function to create a goal
const createPlayerGoal = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      playerId: string;
      title: string;
      description?: string | undefined;
      category: string;
      targetValue: string;
      currentValue?: string | undefined;
      dueDate: string;
      priority: string;
    }) => data,
  )
  .handler(({ data: _data }) => {
    // TODO: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@laxdb/core/player-development/index');
    // return await PlayerDevelopmentAPI.createGoal(data, headers);

    return { success: true, goalId: "goal-123" };
  });

// Server function to get player info
const getPlayerInfo = createServerFn({ method: "GET" })
  .inputValidator((data: { playerId: string }) => data)
  .handler(({ data }) => {
    // TODO: Replace with actual API call
    return {
      id: data.playerId,
      name: "Alex Johnson",
      position: "attack",
      gradeLevel: "junior",
    };
  });

export const Route = createFileRoute(
  "/_protected/$organizationSlug/players/goals/create",
)({
  component: CreateGoalPage,
  validateSearch: (search: Record<string, unknown>) => ({
    playerId: search.playerId as string,
  }),
  loaderDeps: ({ search }) => ({ playerId: search.playerId }),
  loader: async ({ deps }) => {
    if (!deps.playerId) {
      throw new Error("Player ID is required");
    }

    const player = await getPlayerInfo({ data: { playerId: deps.playerId } });
    return { player };
  },
});

function CreateGoalPage() {
  const { organizationSlug } = Route.useParams();
  const { playerId } = Route.useSearch();
  const { player } = Route.useLoaderData();
  const router = useRouter();

  const form = useForm<GoalFormValues>({
    resolver: effectTsResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "skill",
      currentValue: "",
      targetValue: "",
      dueDate: "",
      priority: "medium",
    },
  });

  const onSubmit = async (values: GoalFormValues) => {
    try {
      await createPlayerGoal({
        data: {
          playerId,
          ...values,
        },
      });

      // Navigate back to player page
      router.navigate({
        to: "/$organizationSlug/players/$playerId",
        params: { organizationSlug, playerId },
      });
    } catch {}
  };

  const categories = [
    { value: "skill", label: "Skill Development", icon: "🎯" },
    { value: "academic", label: "Academic", icon: "📚" },
    { value: "team", label: "Team Performance", icon: "🏆" },
    { value: "personal", label: "Personal Development", icon: "🌟" },
  ] as const;

  const priorities = [
    { value: "low", label: "Low", color: "secondary" },
    { value: "medium", label: "Medium", color: "default" },
    { value: "high", label: "High", color: "destructive" },
  ] as const;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Link
          params={{ organizationSlug, playerId }}
          to="/$organizationSlug/players/$playerId"
        >
          <Button className="mb-4" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {player.name}
          </Button>
        </Link>

        <div>
          <h1 className="font-bold text-3xl">Set New Goal</h1>
          <p className="text-muted-foreground">
            Create a development goal for {player.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          >
            <FieldGroup>
              {/* Title */}
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="goal-title">Goal Title</FieldLabel>
                    <Input
                      {...field}
                      id="goal-title"
                      placeholder="e.g., Improve Shot Accuracy"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="goal-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="goal-description"
                      placeholder="Describe the goal and what success looks like..."
                      rows={3}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Optional: Provide more details about this goal
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Category */}
              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Category</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <button
                          className={`flex items-center gap-2 rounded-md border p-3 text-left transition-colors ${
                            field.value === category.value
                              ? "border-primary bg-primary/5"
                              : "border-input hover:bg-muted"
                          }`}
                          key={category.value}
                          onClick={() => {
                            field.onChange(category.value);
                          }}
                          type="button"
                        >
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium text-sm">
                            {category.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Target and Current Values */}
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="currentValue"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="current-value">
                        Current Value
                      </FieldLabel>
                      <Input
                        {...field}
                        id="current-value"
                        placeholder="e.g., 60% accuracy"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="targetValue"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="target-value">
                        Target Value
                      </FieldLabel>
                      <Input
                        {...field}
                        id="target-value"
                        placeholder="e.g., 75% accuracy"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Due Date */}
              <Controller
                name="dueDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="goal-due-date">Due Date</FieldLabel>
                    <div className="relative">
                      <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        id="goal-due-date"
                        className="pl-10"
                        type="date"
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Priority */}
              <Controller
                name="priority"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Priority</FieldLabel>
                    <div className="flex gap-2">
                      {priorities.map((priority) => (
                        <button
                          className={`flex-1 rounded-md border p-2 text-center transition-colors ${
                            field.value === priority.value
                              ? "border-primary bg-primary/5"
                              : "border-input hover:bg-muted"
                          }`}
                          key={priority.value}
                          onClick={() => {
                            field.onChange(priority.value);
                          }}
                          type="button"
                        >
                          <Badge className="w-full" variant={priority.color}>
                            {priority.label}
                          </Badge>
                        </button>
                      ))}
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1"
                type="button"
                variant="outline"
                render={
                  <Link
                    params={{ organizationSlug, playerId }}
                    to="/$organizationSlug/players/$playerId"
                  />
                }
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={form.formState.isSubmitting}
                type="submit"
              >
                {form.formState.isSubmitting ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
