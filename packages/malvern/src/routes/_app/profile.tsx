import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Input } from "@laxdb/ui/components/ui/input";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "../../lib/auth-client";
import { ME_QUERY_KEY, type MeCtx } from "../../lib/session";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

function Profile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { me } = Route.useRouteContext();
  const [name, setName] = useState(me?.userName ?? "");

  const updateName = useMutation({
    mutationFn: async (nextName: string) => {
      const result = await authClient.updateUser({ name: nextName });
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to update profile");
      }
      return nextName;
    },
    onSuccess: async (nextName) => {
      queryClient.setQueryData<MeCtx>(ME_QUERY_KEY, (current) =>
        current === undefined || current === null
          ? current
          : { ...current, userName: nextName },
      );
      await router.invalidate();
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "" || updateName.isPending) return;
    updateName.mutate(trimmed);
  };

  if (!me) return null;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Set the name shown in coach lists, reports, and the app header.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {updateName.error && (
          <Alert variant="destructive">
            <AlertDescription>{updateName.error.message}</AlertDescription>
          </Alert>
        )}
        {updateName.isSuccess && (
          <Alert>
            <AlertDescription>Profile updated.</AlertDescription>
          </Alert>
        )}

        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="name">
              Display name
            </label>
            <Input
              id="name"
              value={name}
              placeholder="Your name"
              onChange={(event) => {
                setName(event.currentTarget.value);
              }}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-sm">{me.userEmail}</div>
          </div>
          <Button
            type="submit"
            disabled={name.trim() === "" || updateName.isPending}
          >
            {updateName.isPending && <Spinner />}
            {updateName.isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
