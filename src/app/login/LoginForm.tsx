"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";
import styles from "./login.module.css";

export function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/login", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    if (response.ok) {
      window.location.assign(next);
      return;
    }
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Sign-in failed");
    setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      {error ? <p className={styles.error}>{error}</p> : null}
      <label className={ui.field}>
        <span className={ui.label}>Password</span>
        <input
          className={ui.input}
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>
      <button
        type="submit"
        className={`${ui.button} ${ui.primary} ${styles.submit}`}
        disabled={busy}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
