"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";
import { messageOf, sendJson } from "@/lib/client-api";
import type { ToolItem } from "@/lib/run/chat-items";
import styles from "./Chat.module.css";

export function ApprovalCard({ runId, tool }: { runId: string; tool: ToolItem }) {
  const [busy, setBusy] = useState(false);
  const [denying, setDenying] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function answer(allow: boolean) {
    setBusy(true);
    setError(null);
    try {
      await sendJson(`/api/runs/${runId}/confirm`, {
        toolUseId: tool.id,
        allow,
        denyMessage: reason,
      });
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <div className={styles.approval} role="group" aria-label="Tool call waiting for approval">
      <div className={styles.approvalHead}>
        <span className={styles.approvalIcon} aria-hidden="true" />
        <strong>
          {tool.server ? `${tool.server}.` : ""}
          {tool.name}
        </strong>
        <span className={ui.subtle}>wants to run</span>
      </div>
      <pre className={styles.approvalInput}>{JSON.stringify(tool.input, null, 2)}</pre>
      {error ? <p className={ui.error}>{error}</p> : null}
      {denying ? (
        <input
          className={ui.input}
          placeholder="Why not? (optional, the agent sees this)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          autoFocus
        />
      ) : null}
      <div className={styles.approvalActions}>
        {denying ? (
          <>
            <button
              type="button"
              className={`${ui.button} ${ui.danger}`}
              disabled={busy}
              onClick={() => answer(false)}
            >
              Deny
            </button>
            <button
              type="button"
              className={ui.button}
              disabled={busy}
              onClick={() => setDenying(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${ui.button} ${ui.primary}`}
              disabled={busy}
              onClick={() => answer(true)}
            >
              Allow
            </button>
            <button
              type="button"
              className={`${ui.button} ${ui.danger}`}
              disabled={busy}
              onClick={() => setDenying(true)}
            >
              Deny…
            </button>
          </>
        )}
      </div>
    </div>
  );
}
