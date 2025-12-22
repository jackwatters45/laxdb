import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema } from 'effect';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock server function for creating games
const createGame = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateGameInput) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    // const { GamesAPI } = await import('@laxdb/core/games/index');
    // const request = getRequest();
    // return await GamesAPI.createGame(data, request.headers);

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      status: 'scheduled' as const,
      homeScore: 0,
      awayScore: 0,
    };
  });

// Form schema
const createGameSchema = Schema.Struct({
  opponentName: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Opponent name is required' })
  ),
  gameDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Date and time is required' })
  ),
  venue: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Venue is required' })
  ),
  isHomeGame: Schema.Boolean,
  gameType: Schema.Literal(
    'regular',
    'playoff',
    'tournament',
    'friendly',
    'practice'
  ),
});

type CreateGameInput = typeof createGameSchema.Type;

// Helper function to format datetime for input
const formatDateTimeForInput = () => {
  // Set default to next Saturday at 2 PM
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay()));
  nextSaturday.setHours(14, 0, 0, 0);
  return nextSaturday.toISOString().slice(0, 16);
};

export const Route = createFileRoute(
  '/_protected/$organizationSlug/games/create'
)({
  component: CreateGamePage,
});

function CreateGamePage() {
  const { organizationSlug } = Route.useParams();

  const router = useRouter();

  const form = useForm<CreateGameInput>({
    resolver: effectTsResolver(createGameSchema),
    defaultValues: {
      opponentName: '',
      gameDate: formatDateTimeForInput(),
      venue: '',
      isHomeGame: true,
      gameType: 'regular',
    },
  });

  const createGameMutation = useMutation({
    mutationKey: ['createGame'],
    mutationFn: (data: CreateGameInput) => createGame({ data }),
    onSuccess: (game) => {
      toast.success(
        `Game against ${game.opponentName} scheduled successfully!`
      );
      router.invalidate();
      router.navigate({
        to: '/$organizationSlug/games',
        params: { organizationSlug },
      });
    },
    onError: (_error) => {
      toast.error('Failed to schedule game. Please try again.');
    },
  });

  const onSubmit = async (values: CreateGameInput) => {
    createGameMutation.mutate(values);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Link params={{ organizationSlug }} to="/$organizationSlug/games">
          <Button className="mb-4" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </Link>

        <h1 className="font-bold text-3xl">Schedule New Game</h1>
        <p className="text-muted-foreground">
          Add a new game to your team's schedule
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="opponentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent Team *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Riverside Hawks, Central Valley Eagles"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gameDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Calendar className="mr-1 inline h-4 w-4" />
                      Date & Time *
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <MapPin className="mr-1 inline h-4 w-4" />
                      Venue *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Memorial Stadium, Lions Field"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isHomeGame"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Game Location</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="grid grid-cols-2 gap-4"
                        onValueChange={(value) =>
                          field.onChange(value === 'true')
                        }
                        value={field.value ? 'true' : 'false'}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem id="home" value="true" />
                          <label htmlFor="home">Home Game</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem id="away" value="false" />
                          <label htmlFor="away">Away Game</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gameType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Type</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select game type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular Season</SelectItem>
                        <SelectItem value="playoff">Playoff</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1"
                  onClick={() =>
                    router.navigate({
                      to: '/$organizationSlug/games',
                      params: { organizationSlug },
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    form.formState.isSubmitting || createGameMutation.isPending
                  }
                  type="submit"
                >
                  {createGameMutation.isPending
                    ? 'Scheduling...'
                    : 'Schedule Game'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
