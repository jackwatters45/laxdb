import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [err, setErr] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErr(null);
    try {
      await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: "/",
      });
      setStatus("sent");
    } catch (cause) {
      setStatus("error");
      setErr(String(cause));
    }
  };

  return (
    <main className="page stack" style={{ maxWidth: 480 }}>
      <header>
        <h1>Sign in</h1>
        <p className="muted">We'll email you a magic link.</p>
      </header>

      <section className="panel stack">
        {status === "sent" ? (
          <>
            <p>
              Check your inbox — link sent to <strong>{email}</strong>.
            </p>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              (Dev mode: check the api worker logs for the link.)
            </p>
          </>
        ) : (
          <form className="stack" onSubmit={submit}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.currentTarget.value);
              }}
              required
            />
            <button
              className="primary"
              type="submit"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
