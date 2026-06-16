import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  // A session can land here without an active organization (e.g. sessions
  // created before the activate-on-login hook). If the user already belongs
  // to one, re-activate it instead of offering to create a duplicate.
  const memberships = useQuery({
    queryKey: ["my-organizations"],
    queryFn: async () => {
      const result = await authClient.organization.list();
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to load teams");
      }
      return result.data ?? [];
    },
  });

  const rejoin = useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await authClient.organization.setActive({
        organizationId,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to rejoin team");
      }
    },
    onSuccess: async () => {
      await router.invalidate();
      await router.navigate({ to: "/fines" });
    },
  });

  const existingOrg = memberships.data?.[0];
  const existingOrgId = existingOrg?.id;
  const { mutate: rejoinMutate } = rejoin;
  useEffect(() => {
    if (existingOrgId !== undefined) rejoinMutate(existingOrgId);
  }, [existingOrgId, rejoinMutate]);

  const createTeam = useMutation({
    mutationFn: async (input: { name: string; slug: string }) => {
      const org = await authClient.organization.create({
        name: input.name,
        slug: input.slug || slugify(input.name),
      });
      if (org.error) {
        throw new Error(org.error.message ?? "Failed to create team");
      }
      const organizationId = getCreatedOrganizationId(org);
      if (organizationId !== null) {
        await authClient.organization.setActive({ organizationId });
      }
    },
    onSuccess: async () => {
      await router.invalidate();
      await router.navigate({ to: "/fines" });
    },
  });

  const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || createTeam.isPending) return;
    createTeam.mutate({ name: trimmedName, slug: slug.trim() });
  };

  if (memberships.isPending || existingOrg !== undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-xs/relaxed text-muted-foreground">
              <Spinner className="size-3.5" />
              {existingOrg !== undefined
                ? `Rejoining ${existingOrg.name}…`
                : "Checking memberships…"}
            </p>
            {rejoin.isError && (
              <Alert variant="destructive">
                <AlertDescription>{rejoin.error.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your team</CardTitle>
          <CardDescription>
            You're the first one here — set up the team, then invite players.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="team-name">Team name</FieldLabel>
                <Input
                  id="team-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  placeholder="Malvern Lacrosse Club"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="team-slug">URL slug (optional)</FieldLabel>
                <Input
                  id="team-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                  }}
                  placeholder="malvern-lacrosse"
                />
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" disabled={createTeam.isPending}>
              {createTeam.isPending && <Spinner />}
              {createTeam.isPending ? "Creating…" : "Create team"}
            </Button>
            {createTeam.isError && (
              <Alert variant="destructive">
                <AlertDescription>{createTeam.error.message}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const getCreatedOrganizationId = (value: unknown): string | null => {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  return typeof value.data.id === "string" ? value.data.id : null;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
