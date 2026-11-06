import Link from "next/link";
import { RelativeTime } from "@/components/RelativeTime";
import { StatusBadge } from "@/components/StatusBadge";
import { describeStopReason } from "@/lib/run/status";
import type { RunSummary } from "@/lib/types";
import styles from "./RunList.module.css";

function repoName(repo: string): string {
  return repo.split("/")[1] ?? repo;
}

function RunRow({ run, note }: { run: RunSummary; note?: string }) {
  const detail = note ?? (run.status === "running" ? null : describeStopReason(run.stopReason));
  return (
    <li>
      <Link href={`/runs/${run.id}`} className={`${styles.row} ${styles[run.status]}`}>
        <span className={styles.status}>
          <StatusBadge status={run.status} />
        </span>
        <span className={styles.main}>
          <span className={styles.title}>{run.title}</span>
          <span className={styles.meta}>
            <span className={styles.agent}>{run.agentName}</span>
            {run.repos.map((repo) => (
              <span key={repo} className={styles.repo} title={repo}>
                {repoName(repo)}
              </span>
            ))}
            {detail ? <span className={styles.detail}>{detail}</span> : null}
          </span>
        </span>
        <span className={styles.time}>
          <RelativeTime iso={run.lastActivityAt} />
        </span>
      </Link>
    </li>
  );
}

export function RunList({
  runs,
  notes = {},
  empty,
}: {
  runs: RunSummary[];
  notes?: Record<string, string>;
  empty: React.ReactNode;
}) {
  if (!runs.length) return <div className={styles.empty}>{empty}</div>;
  return (
    <ul className={styles.list}>
      {runs.map((run) => (
        <RunRow key={run.id} run={run} note={notes[run.id]} />
      ))}
    </ul>
  );
}
