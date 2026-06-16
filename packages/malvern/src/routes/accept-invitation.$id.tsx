import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Card, CardContent } from "@laxdb/ui/components/ui/card";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/accept-invitation/$id")({
  component: Accept,
});

function Accept() {
  const { id } = Route.useParams();
  const router = useRouter();

  const accept = useMutation({
    mutationFn: async (invitationId: string) => {
      const session = await authClient.getSession();
      if (!session.data) return { needLogin: true };
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to accept invitation");
      }
      return { needLogin: false };
    },
    onSuccess: async ({ needLogin }) => {
      if (needLogin) return;
      await router.invalidate();
      await router.navigate({ to: "/fines" });
    },
  });

  const { mutate } = accept;
  useEffect(() => {
    mutate(id);
  }, [mutate, id]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-lg font-semibold tracking-tight">
          Accept invitation
        </h1>
        {(accept.isPending || accept.isIdle) && (
          <p className="flex items-center gap-2 text-xs/relaxed text-muted-foreground">
            <Spinner className="size-3.5" />
            Checking…
          </p>
        )}
        {accept.data?.needLogin === true && (
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p>Sign in first to accept this invitation.</p>
              <a
                className="w-fit underline underline-offset-4 hover:text-foreground"
                href={`/login?next=/accept-invitation/${id}`}
              >
                Go to sign in →
              </a>
            </CardContent>
          </Card>
        )}
        {accept.data?.needLogin === false && (
          <p className="text-xs/relaxed">Joined. Redirecting…</p>
        )}
        {accept.isError && (
          <Alert variant="destructive">
            <AlertDescription>{accept.error.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}
