import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Schema } from "effect";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@laxdb/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";

// Mock server function for creating games
const createGame = createServerFn({ method: "POST" })
  .inputValidator((data: CreateGameInput) => data)
  .handler(async ({ data }) => {
    // FIX: Replace with actual API call
    // const { GamesAPI } = await import('@laxdb/core/games/index');
    // const request = getRequest();
    // return await GamesAPI.createGame(data, request.headers);

    // Mock delay
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    return {
      id: Math.random().toString(36).slice(2, 9),
      ...data,
      status: "scheduled" as const,
      homeScore: 0,
      awayScore: 0,
    };
  });

// Form schema
const createGameSchema = Schema.Struct({
  opponentName: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Opponent name is required" }),
  ),
  gameDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Date and time is required" }),
  ),
  venue: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Venue is required" }),
  ),
  isHomeGame: Schema.Boolean,
  gameType: Schema.Literal(
    "regular",
    "playoff",
    "tournament",
    "friendly",
    "practice",
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
  "/_protected/$organizationSlug/games/create",
)({
  component: CreateGamePage,
});

function CreateGamePage() {
  const { organizationSlug } = Route.useParams();

  const router = useRouter();

  const form = useForm<CreateGameInput>({
    resolver: effectTsResolver(createGameSchema),
    defaultValues: {
      opponentName: "",
      gameDate: formatDateTimeForInput(),
      venue: "",
      isHomeGame: true,
      gameType: "regular",
    },
  });

  const createGameMutation = useMutation({
    mutationKey: ["createGame"],
    mutationFn: (data: CreateGameInput) => createGame({ data }),
    onSuccess: (game) => {
      toast.success(
        `Game against ${game.opponentName} scheduled successfully!`,
      );
      router.invalidate();
      router.navigate({
        to: "/$organizationSlug/games",
        params: { organizationSlug },
      });
    },
    onError: (_error) => {
      toast.error("Failed to schedule game. Please try again.");
    },
  });

  const onSubmit = (values: CreateGameInput) => {
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
          Add a new game to your team&apos;s schedule
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          >
            <FieldGroup>
              <Controller
                name="opponentName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="opponent-name">
                      Opponent Team *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="opponent-name"
                      placeholder="e.g., Riverside Hawks, Central Valley Eagles"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="gameDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="game-date">
                      <Calendar className="mr-1 inline h-4 w-4" />
                      Date & Time *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="game-date"
                      type="datetime-local"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="venue"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="venue">
                      <MapPin className="mr-1 inline h-4 w-4" />
                      Venue *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="venue"
                      placeholder="e.g., Memorial Stadium, Lions Field"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="isHomeGame"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Game Location</FieldLabel>
                    <RadioGroup
                      className="grid grid-cols-2 gap-4"
                      value={field.value ? "true" : "false"}
                      onValueChange={(value) => {
                        field.onChange(value === "true");
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="home" value="true" />
                        <Label htmlFor="home" className="font-normal">
                          Home Game
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="away" value="false" />
                        <Label htmlFor="away" className="font-normal">
                          Away Game
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="gameType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="game-type">Game Type</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="game-type"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue>
                          {(value) => {
                            const labels: Record<string, string> = {
                              regular: "Regular Season",
                              playoff: "Playoff",
                              tournament: "Tournament",
                              friendly: "Friendly",
                              practice: "Practice",
                            };
                            return (
                              labels[value as string] ?? "Select game type"
                            );
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Season</SelectItem>
                        <SelectItem value="playoff">Playoff</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <div className="flex gap-4 pt-4">
              <Button
                className="flex-1"
                onClick={() =>
                  router.navigate({
                    to: "/$organizationSlug/games",
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
                  ? "Scheduling..."
                  : "Schedule Game"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
