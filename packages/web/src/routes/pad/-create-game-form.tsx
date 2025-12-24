import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { CreateGameInput } from "@laxdb/core/game/game.schema";
import { GameService } from "@laxdb/core/game/game.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-content";
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
import { authMiddleware } from "@/lib/middleware";

const createGame = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof CreateGameInput.Type) =>
    Schema.decodeSync(CreateGameInput)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const gameService = yield* GameService;
        return yield* gameService.create(data);
      }),
    ),
  );

type FormData = typeof CreateGameInput.Type;

export function CreateGameForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: effectTsResolver(CreateGameInput),
    defaultValues: {
      organizationId,
    },
  });

  const createGameMutation = useMutation({
    mutationFn: (data: FormData) => createGame({ data }),
    onSuccess: async (_result, _variables) => {
      await router.invalidate();
    },
    onError: (_error, _variables) => {
      toast.error("Failed to create game. Please try again.");
    },
  });

  const onSubmit = (data: FormData) => {
    createGameMutation.mutate(data);
  };

  return (
    <PageContainer className="space-y-4">
      <div>
        <h1 className="font-bold text-xl">Create a Game</h1>
        <p className="text-muted-foreground">
          Add a game to manage rosters, scouting reports and game breakdowns.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            >
              <FormField
                control={form.control}
                name="opponentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Malvern Lacrosse Club"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button disabled={createGameMutation.isPending} type="submit">
                  {createGameMutation.isPending ? "Creating..." : "Create Game"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
