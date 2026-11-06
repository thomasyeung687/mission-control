import Link from "next/link";
import { RelativeTime } from "@/components/RelativeTime";
import ui from "@/components/ui.module.css";
import { MODEL_OPTIONS, PERMISSION_OPTIONS } from "@/lib/agent-config";
import type { AgentSummary } from "@/lib/types";
import styles from "./AgentList.module.css";

const modelLabel = (id: string) => MODEL_OPTIONS.find((m) => m.id === id)?.label ?? id;
const permissionLabel = (id: string) =>
  PERMISSION_OPTIONS.find((p) => p.id === id)?.label.split(" —")[0] ?? id;

export function AgentList({ agents }: { agents: AgentSummary[] }) {
  return (
    <ul className={styles.grid}>
      {agents.map((agent) => (
        <li key={agent.id} className={`${ui.panel} ${styles.card}`}>
          <div className={styles.head}>
            <h2>{agent.name}</h2>
            <span className={styles.version}>v{agent.version}</span>
          </div>
          {agent.description ? <p className={styles.description}>{agent.description}</p> : null}
          <dl className={styles.facts}>
            <dt>Model</dt>
            <dd>{modelLabel(agent.model)}</dd>
            <dt>Approvals</dt>
            <dd>{permissionLabel(agent.permission)}</dd>
            <dt>Web</dt>
            <dd>{agent.webAccess ? "On" : "Off"}</dd>
            <dt>Updated</dt>
            <dd>
              <RelativeTime iso={agent.updatedAt} />
            </dd>
          </dl>
          <div className={styles.actions}>
            <Link
              href={`/runs/new?agent=${agent.id}`}
              className={`${ui.button} ${ui.small} ${ui.primary}`}
            >
              Start run
            </Link>
            <Link href={`/agents/${agent.id}`} className={`${ui.button} ${ui.small}`}>
              Edit
            </Link>
            <Link href={`/runs?agent=${agent.id}`} className={`${ui.button} ${ui.small}`}>
              Runs
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
