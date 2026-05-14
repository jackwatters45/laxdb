import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/accept-invitation/$id")({
  component: Accept,
});

function Accept() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "need-login" | "ok" | "error">(
    "loading",
  );
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data) {
          setState("need-login");
          return;
        }
        await authClient.organization.acceptInvitation({ invitationId: id });
        await router.invalidate();
        setState("ok");
        await router.navigate({ to: "/fines" });
      } catch (e) {
        setErr(String(e));
        setState("error");
      }
    })();
  }, [id, router]);

  return (
    <main className="page stack" style={{ maxWidth: 520 }}>
      <h1>Accept invitation</h1>
      {state === "loading" && <p className="muted">Checking…</p>}
      {state === "need-login" && (
        <section className="panel stack">
          <p>Sign in first to accept this invitation.</p>
          <a href={`/login?next=/accept-invitation/${id}`}>Go to sign in →</a>
        </section>
      )}
      {state === "ok" && <p>Joined. Redirecting…</p>}
      {state === "error" && (
        <section className="panel" style={{ color: "var(--danger)" }}>
          {err}
        </section>
      )}
    </main>
  );
}
