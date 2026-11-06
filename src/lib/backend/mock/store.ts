import { statusFromEvent } from "@/lib/run/status";
import type { AgentSummary, ApiSessionStatus, StreamEvent } from "@/lib/types";

export interface MockRun {
  id: string;
  title: string;
  agentId: string;
  repos: string[];
  apiStatus: ApiSessionStatus;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, string>;
  events: StreamEvent[];
  listeners: Set<(event: StreamEvent) => void>;
  generation: number;
  live: boolean;
}

export interface MockStore {
  agents: Map<string, AgentSummary>;
  runs: Map<string, MockRun>;
}

const API_STATUS: Record<string, ApiSessionStatus> = {
  running: "running",
  waiting: "idle",
  idle: "idle",
  ended: "terminated",
};

function isPersisted(event: StreamEvent): boolean {
  return event.type !== "event_start" && event.type !== "event_delta";
}

function persist(run: MockRun, event: StreamEvent): void {
  const index = run.events.findIndex((e) => "id" in e && "id" in event && e.id === event.id);
  if (index >= 0) run.events[index] = event;
  else run.events.push(event);
}

export function emit(run: MockRun, event: StreamEvent): void {
  if (isPersisted(event)) {
    persist(run, event);
    const snapshot = statusFromEvent(event);
    if (snapshot) run.apiStatus = API_STATUS[snapshot.status] ?? run.apiStatus;
    run.updatedAt = new Date().toISOString();
  }
  for (const listener of run.listeners) listener(event);
}

export function lastStatusEvent(run: MockRun): StreamEvent | null {
  for (let i = run.events.length - 1; i >= 0; i -= 1) {
    const event = run.events[i];
    if (event && statusFromEvent(event)) return event;
  }
  return null;
}
