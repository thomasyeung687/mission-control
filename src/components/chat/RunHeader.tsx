"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import ui from "@/components/ui.module.css";
import { messageOf, sendJson } from "@/lib/client-api";
import type { RunStatus, RunSummary } from "@/lib/types";
import type { Connection } from "./useRunStream";
import styles from "./Chat.module.css";

const CONNECTION_LABEL: Record<Connection, string> = {
  connecting: "Connecting…",
  live: "Live",
  reconnecting: "Reconnecting…",
  closed: "Ended",
};

interface Props {
  run: RunSummary;
  status: RunStatus;
  connection: Connection;
  consoleUrl: string | null;
}

export function RunHeader({ run, status, connection, consoleUrl }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function interrupt() {
    setBusy(true);
    setError(null);
    try {
      await sendJson(`/api/runs/${run.id}/interrupt`);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <Link href="/runs" className={styles.back} aria-label="Back to runs">
          ←
        </Link>
        <h1 className={styles.headerTitle}>{run.title}</h1>
        {status === "running" ? (
          <button
            type="button"
            className={`${ui.button} ${ui.small} ${ui.danger}`}
            onClick={interrupt}
            disabled={busy}
          >
            {busy ? "Stopping…" : "Interrupt"}
          </button>
        ) : null}
      </div>
      <div className={styles.headerMeta}>
        <StatusBadge status={status} />
        <span className={styles.metaAgent}>{run.agentName}</span>
        {run.repos.map((repo) => (
          <span key={repo} className={styles.metaRepo}>
            {repo}
          </span>
        ))}
        <span className={`${styles.connection} ${styles[`conn_${connection}`] ?? ""}`}>
          {CONNECTION_LABEL[connection]}
        </span>
        {consoleUrl ? (
          <a href={consoleUrl} target="_blank" rel="noreferrer" className={styles.consoleLink}>
            Console ↗
          </a>
        ) : null}
      </div>
      {error ? <p className={ui.error}>{error}</p> : null}
    </header>
  );
}
