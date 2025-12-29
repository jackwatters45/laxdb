import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Schema } from "effect";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
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
const resourceFormSchema = Schema.Struct({
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
    Schema.maxLength(100, {
      message: () => "Title must be less than 100 characters",
    }),
  ),
  description: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Description is required" }),
    Schema.maxLength(500, {
      message: () => "Description must be less than 500 characters",
    }),
  ),
  type: Schema.Literal("drill", "video", "article", "program"),
  dueDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Due date is required" }),
  ),
  priority: Schema.Literal("low", "medium", "high"),
});

type ResourceFormValues = typeof resourceFormSchema.Type;

// Server function to assign a resource
const assignPlayerResource = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      playerId: string;
      title: string;
      description: string;
      type: string;
      dueDate: string;
      priority: string;
    }) => data,
  )
  .handler(({ data: _data }) => {
    // TODO: Replace with actual API call
    return { success: true, resourceId: "resource-123" };
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
  "/_protected/$organizationSlug/players/resources/create",
)({
  component: CreateResourcePage,
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

function CreateResourcePage() {
  const { organizationSlug } = Route.useParams();
  const { playerId } = Route.useSearch();
  const { player } = Route.useLoaderData();
  const router = useRouter();

  const form = useForm<ResourceFormValues>({
    resolver: effectTsResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "drill",
      dueDate: "",
      priority: "medium",
    },
  });

  const onSubmit = async (values: ResourceFormValues) => {
    try {
      await assignPlayerResource({
        data: {
          playerId,
          ...values,
        },
      });

      // Navigate back to player page
      router.navigate({
        to: "/$organizationSlug/players/$playerId",
        params: {
          organizationSlug,
          playerId,
        },
      });
    } catch {}
  };

  const resourceTypes = [
    {
      value: "drill",
      label: "Training Drill",
      icon: "🏃",
      description: "Physical practice exercises",
    },
    {
      value: "video",
      label: "Video Content",
      icon: "📹",
      description: "Educational videos or tutorials",
    },
    {
      value: "article",
      label: "Article/Reading",
      icon: "📖",
      description: "Written materials and guides",
    },
    {
      value: "program",
      label: "Training Program",
      icon: "📋",
      description: "Structured development programs",
    },
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
          params={{
            organizationSlug,
            playerId,
          }}
          to={"/$organizationSlug/players/$playerId"}
        >
          <Button className="mb-4" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {player.name}
          </Button>
        </Link>

        <div>
          <h1 className="font-bold text-3xl">Assign Resource</h1>
          <p className="text-muted-foreground">
            Assign a learning resource to {player.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Resource Details
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
                    <FieldLabel htmlFor="resource-title">
                      Resource Title
                    </FieldLabel>
                    <Input
                      {...field}
                      id="resource-title"
                      placeholder="e.g., Advanced Shooting Drills"
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
                    <FieldLabel htmlFor="resource-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="resource-description"
                      placeholder="Describe what the player will learn and how it will help their development..."
                      rows={4}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Explain how this resource will help the player&apos;s
                      development
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Resource Type */}
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Resource Type</FieldLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {resourceTypes.map((type) => (
                        <button
                          className={`flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-colors ${
                            field.value === type.value
                              ? "border-primary bg-primary/5"
                              : "border-input hover:bg-muted"
                          }`}
                          key={type.value}
                          onClick={() => {
                            field.onChange(type.value);
                          }}
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{type.icon}</span>
                            <span className="font-medium text-sm">
                              {type.label}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {type.description}
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

              {/* Due Date */}
              <Controller
                name="dueDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="resource-due-date">
                      Due Date
                    </FieldLabel>
                    <div className="relative">
                      <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        id="resource-due-date"
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
                    params={{
                      organizationSlug,
                      playerId,
                    }}
                    to={"/$organizationSlug/players/$playerId"}
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
                {form.formState.isSubmitting
                  ? "Assigning..."
                  : "Assign Resource"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
