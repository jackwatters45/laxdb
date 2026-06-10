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
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");

  const sendLink = useMutation({
    mutationFn: async (address: string) => {
      const result = await authClient.signIn.magicLink({
        email: address,
        callbackURL: "/",
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to send magic link");
      }
      return address;
    },
  });

  const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || sendLink.isPending) return;
    sendLink.mutate(trimmed);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>We'll email you a magic link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sendLink.isSuccess ? (
            <div className="flex flex-col gap-2">
              <p>
                Check your inbox — link sent to <strong>{sendLink.data}</strong>
                .
              </p>
              <p className="text-muted-foreground">
                (Dev mode: check the api worker logs for the link.)
              </p>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submit}>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                required
              />
              <Button type="submit" size="lg" disabled={sendLink.isPending}>
                {sendLink.isPending && <Spinner />}
                {sendLink.isPending ? "Sending…" : "Send magic link"}
              </Button>
              {sendLink.isError && (
                <Alert variant="destructive">
                  <AlertDescription>{sendLink.error.message}</AlertDescription>
                </Alert>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
