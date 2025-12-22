import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema } from 'effect';
import { ArrowLeft, Calendar, Target } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Form schema
const goalFormSchema = Schema.Struct({
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Title is required' }),
    Schema.maxLength(100, {
      message: () => 'Title must be less than 100 characters',
    })
  ),
  description: Schema.optional(Schema.String),
  category: Schema.Literal('skill', 'academic', 'team', 'personal'),
  currentValue: Schema.optional(Schema.String),
  targetValue: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Target value is required' })
  ),
  dueDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Due date is required' })
  ),
  priority: Schema.Literal('low', 'medium', 'high'),
});

type GoalFormValues = typeof goalFormSchema.Type;

// Server function to create a goal
const createPlayerGoal = createServerFn({ method: 'POST' })
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
    }) => data
  )
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@laxdb/core/player-development/index');
    // return await PlayerDevelopmentAPI.createGoal(data, headers);

    return { success: true, goalId: 'goal-123' };
  });

// Server function to get player info
const getPlayerInfo = createServerFn({ method: 'GET' })
  .inputValidator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    return {
      id: data.playerId,
      name: 'Alex Johnson',
      position: 'attack',
      gradeLevel: 'junior',
    };
  });

export const Route = createFileRoute(
  '/_protected/$organizationSlug/players/goals/create'
)({
  component: CreateGoalPage,
  validateSearch: (search: Record<string, unknown>) => ({
    playerId: search.playerId as string,
  }),
  loaderDeps: ({ search }) => ({ playerId: search.playerId }),
  loader: async ({ deps }) => {
    if (!deps.playerId) {
      throw new Error('Player ID is required');
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
      title: '',
      description: '',
      category: 'skill',
      currentValue: '',
      targetValue: '',
      dueDate: '',
      priority: 'medium',
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
        to: '/$organizationSlug/players/$playerId',
        params: { organizationSlug, playerId },
      });
    } catch (_error) {}
  };

  const categories = [
    { value: 'skill', label: 'Skill Development', icon: '🎯' },
    { value: 'academic', label: 'Academic', icon: '📚' },
    { value: 'team', label: 'Team Performance', icon: '🏆' },
    { value: 'personal', label: 'Personal Development', icon: '🌟' },
  ] as const;

  const priorities = [
    { value: 'low', label: 'Low', color: 'secondary' },
    { value: 'medium', label: 'Medium', color: 'default' },
    { value: 'high', label: 'High', color: 'destructive' },
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
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Improve Shot Accuracy"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the goal and what success looks like..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Provide more details about this goal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <button
                            className={`flex items-center gap-2 rounded-md border p-3 text-left transition-colors ${
                              field.value === category.value
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:bg-muted'
                            }`}
                            key={category.value}
                            onClick={() => field.onChange(category.value)}
                            type="button"
                          >
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-medium text-sm">
                              {category.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target and Current Values */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 60% accuracy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 75% accuracy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" type="date" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {priorities.map((priority) => (
                          <button
                            className={`flex-1 rounded-md border p-2 text-center transition-colors ${
                              field.value === priority.value
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:bg-muted'
                            }`}
                            key={priority.value}
                            onClick={() => field.onChange(priority.value)}
                            type="button"
                          >
                            <Badge className="w-full" variant={priority.color}>
                              {priority.label}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  asChild
                  className="flex-1"
                  type="button"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug, playerId }}
                    to="/$organizationSlug/players/$playerId"
                  >
                    Cancel
                  </Link>
                </Button>
                <Button
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
