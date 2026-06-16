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

  const googleSignIn = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (result.error) {
        throw new Error(
          result.error.message ?? "Failed to start Google sign in",
        );
      }
    },
  });

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

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
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
          <CardDescription>
            Continue with Google or get a magic link by email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              size="lg"
              disabled={googleSignIn.isPending}
              onClick={() => {
                googleSignIn.mutate();
              }}
            >
              {googleSignIn.isPending && <Spinner />}
              {googleSignIn.isPending ? "Redirecting…" : "Continue with Google"}
            </Button>

            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              <div className="h-px flex-1 bg-border" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form className="flex flex-col gap-3" onSubmit={submit}>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                required
              />
              <Button type="submit" size="lg" disabled={sendLink.isPending}>
                {sendLink.isPending && <Spinner />}
                {sendLink.isPending
                  ? "Generating…"
                  : sendLink.isSuccess
                    ? "Resend magic link"
                    : "Send magic link"}
              </Button>
            </form>

            {sendLink.isSuccess && (
              <Alert>
                <AlertDescription>
                  Magic link generated for <strong>{sendLink.data}</strong>. In
                  local mode, check the api worker logs; no email is sent.
                </AlertDescription>
              </Alert>
            )}

            {(googleSignIn.isError || sendLink.isError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {googleSignIn.error?.message ?? sendLink.error?.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
