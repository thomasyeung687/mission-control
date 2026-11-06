import { STATUS_LABELS } from "@/lib/run/status";
import type { RunStatus } from "@/lib/types";
import styles from "./StatusBadge.module.css";

export function StatusIcon({ status }: { status: RunStatus }) {
  return <span className={`${styles.icon} ${styles[status]}`} aria-hidden="true" />;
}

export function StatusBadge({ status, compact = false }: { status: RunStatus; compact?: boolean }) {
  return (
    <span className={`${styles.badge} ${styles[`${status}Badge`]}`} title={STATUS_LABELS[status]}>
      <StatusIcon status={status} />
      {compact ? (
        <span className="visually-hidden">{STATUS_LABELS[status]}</span>
      ) : (
        STATUS_LABELS[status]
      )}
    </span>
  );
}
