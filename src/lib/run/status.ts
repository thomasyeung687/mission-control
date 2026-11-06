import type { ApiSessionStatus, RunStatus, SessionEvent, StreamEvent } from "@/lib/types";

const STATUS_EVENT_TYPES = [
  "session.status_running",
  "session.status_rescheduled",
  "session.status_idle",
  "session.status_terminated",
] as const;

export type StatusEventType = (typeof STATUS_EVENT_TYPES)[number];
export const statusEventTypes: readonly StatusEventType[] = STATUS_EVENT_TYPES;

export interface StatusSnapshot {
  status: RunStatus;
  stopReason: string | null;
}

export function deriveRunStatus(
  apiStatus: ApiSessionStatus,
  lastIdleStopReason: string | null,
): RunStatus {
  switch (apiStatus) {
    case "running":
    case "rescheduling":
      return "running";
    case "terminated":
      return "ended";
    case "idle":
      return lastIdleStopReason === "requires_action" ? "waiting" : "idle";
  }
}

export function statusFromEvent(event: SessionEvent | StreamEvent): StatusSnapshot | null {
  switch (event.type) {
    case "session.status_running":
    case "session.status_rescheduled":
      return { status: "running", stopReason: null };
    case "session.status_terminated":
      return { status: "ended", stopReason: null };
    case "session.status_idle":
      return {
        status: event.stop_reason.type === "requires_action" ? "waiting" : "idle",
        stopReason: event.stop_reason.type,
      };
    default:
      return null;
  }
}

export function isFinished(status: RunStatus): boolean {
  return status === "idle" || status === "ended";
}

export const STATUS_LABELS: Record<RunStatus, string> = {
  running: "Running",
  waiting: "Waiting on you",
  idle: "Idle",
  ended: "Ended",
};

const STOP_REASON_LABELS: Record<string, string> = {
  end_turn: "Finished its turn",
  requires_action: "Needs your approval",
  retries_exhausted: "Stopped after repeated errors",
  budget_reached: "Paused at its budget",
  refusal: "Declined the request",
};

export function describeStopReason(stopReason: string | null): string | null {
  if (!stopReason) return null;
  return STOP_REASON_LABELS[stopReason] ?? stopReason;
}
