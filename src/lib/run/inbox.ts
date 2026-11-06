import type { RunSummary } from "@/lib/types";
import { isFinished } from "./status";

export type InboxReason = "waiting" | "finished";

export interface InboxEntry {
  run: RunSummary;
  reason: InboxReason;
}

export function inboxReason(run: RunSummary): InboxReason | null {
  if (run.status === "waiting") return "waiting";
  if (!isFinished(run.status) || !run.finishedAt) return null;
  if (!run.seenAt) return "finished";
  return Date.parse(run.finishedAt) > Date.parse(run.seenAt) ? "finished" : null;
}

function recency(run: RunSummary): number {
  return Date.parse(run.finishedAt ?? run.lastActivityAt);
}

export function buildInbox(runs: readonly RunSummary[]): InboxEntry[] {
  return runs
    .map((run) => ({ run, reason: inboxReason(run) }))
    .filter((entry): entry is InboxEntry => entry.reason !== null)
    .sort((a, b) => {
      if (a.reason !== b.reason) return a.reason === "waiting" ? -1 : 1;
      return recency(b.run) - recency(a.run);
    });
}
