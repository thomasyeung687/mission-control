import type { ApiSessionStatus, RunSummary, SessionEvent, StreamEvent } from "@/lib/types";
import { deriveRunStatus } from "./status";
import { repoFromUrl } from "./text";

export const SEEN_METADATA_KEY = "mc_seen_at";

export interface SessionLike {
  id: string;
  title: string | null;
  status: ApiSessionStatus;
  created_at: string;
  updated_at: string;
  metadata: Record<string, string>;
  agent: { id: string; name: string };
  resources: ReadonlyArray<{ type: string; url?: string }>;
}

export function reposOf(resources: SessionLike["resources"]): string[] {
  return resources.flatMap((r) =>
    r.type === "github_repository" && r.url ? [repoFromUrl(r.url)] : [],
  );
}

export function toRunSummary(
  session: SessionLike,
  lastStatus: SessionEvent | StreamEvent | null,
): RunSummary {
  const stopReason =
    lastStatus?.type === "session.status_idle" ? lastStatus.stop_reason.type : null;
  const status = deriveRunStatus(session.status, stopReason);
  const statusAt = lastStatus && "processed_at" in lastStatus ? lastStatus.processed_at : null;
  const finished = status === "idle" || status === "ended";
  return {
    id: session.id,
    title: session.title ?? "Untitled run",
    agentId: session.agent.id,
    agentName: session.agent.name,
    repos: reposOf(session.resources),
    status,
    stopReason: status === "running" ? null : stopReason,
    createdAt: session.created_at,
    lastActivityAt: statusAt ?? session.updated_at,
    finishedAt: finished ? (statusAt ?? session.updated_at) : null,
    seenAt: session.metadata[SEEN_METADATA_KEY] ?? null,
  };
}
