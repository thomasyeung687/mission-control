"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusIcon } from "@/components/StatusBadge";
import { STATUS_LABELS } from "@/lib/run/status";
import { RUN_STATUSES, type AgentSummary, type RunStatus } from "@/lib/types";
import styles from "./RunFilters.module.css";

function hrefWith(params: URLSearchParams, key: string, value: string | null): string {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  const query = next.toString();
  return query ? `/runs?${query}` : "/runs";
}

export function RunFilters({
  agents,
  counts,
}: {
  agents: AgentSummary[];
  counts: Record<RunStatus, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status");
  return (
    <div className={styles.filters}>
      <div className={styles.chips} role="group" aria-label="Filter by status">
        <Link
          href={hrefWith(params, "status", null)}
          className={`${styles.chip} ${!status ? styles.on : ""}`}
        >
          All
        </Link>
        {RUN_STATUSES.map((value) => (
          <Link
            key={value}
            href={hrefWith(params, "status", status === value ? null : value)}
            className={`${styles.chip} ${status === value ? styles.on : ""}`}
          >
            <StatusIcon status={value} />
            {STATUS_LABELS[value]}
            <span className={styles.count}>{counts[value]}</span>
          </Link>
        ))}
      </div>
      <select
        className={styles.select}
        aria-label="Filter by agent"
        value={params.get("agent") ?? ""}
        onChange={(event) => router.push(hrefWith(params, "agent", event.target.value || null))}
      >
        <option value="">All agents</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
    </div>
  );
}
