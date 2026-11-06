"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";
import { messageOf, sendJson } from "@/lib/client-api";
import styles from "./Chat.module.css";

export function Composer({
  runId,
  disabledReason,
}: {
  runId: string;
  disabledReason: string | null;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = !!disabledReason;

  async function send() {
    const message = text.trim();
    if (!message || busy || disabled) return;
    setBusy(true);
    setError(null);
    try {
      await sendJson(`/api/runs/${runId}/messages`, { text: message });
      setText("");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      {error ? <p className={styles.composerError}>{error}</p> : null}
      <div className={styles.composerRow}>
        <textarea
          className={`${ui.input} ${styles.composerInput}`}
          rows={1}
          placeholder={disabledReason ?? "Message the agent…"}
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void send();
            }
          }}
          aria-label="Message the agent. Messages queue while it works."
        />
        <button
          type="submit"
          className={`${ui.button} ${ui.primary}`}
          disabled={disabled || busy || !text.trim()}
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
