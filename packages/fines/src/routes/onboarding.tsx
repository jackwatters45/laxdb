import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const org = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
      });
      const organizationId = getCreatedOrganizationId(org);
      if (organizationId !== null) {
        await authClient.organization.setActive({ organizationId });
      }
      await router.invalidate();
      router.navigate({ to: "/fines" });
    } catch (cause) {
      setErr(String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page stack" style={{ maxWidth: 520 }}>
      <header>
        <h1>Create your team</h1>
        <p className="muted">
          You're the first one here — set up the team, then invite players.
        </p>
      </header>
      <section className="panel stack">
        <form className="stack" onSubmit={submit}>
          <label className="stack" style={{ gap: "0.25rem" }}>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Team name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="LaxDB Fines Mustangs"
              required
            />
          </label>
          <label className="stack" style={{ gap: "0.25rem" }}>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              URL slug (optional)
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.currentTarget.value)}
              placeholder="laxdb-fines-mustangs"
            />
          </label>
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create team"}
          </button>
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
        </form>
      </section>
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
