import type {
  BetaManagedAgentsSessionEvent,
  BetaManagedAgentsStreamSessionEvents,
} from "@anthropic-ai/sdk/resources/beta/sessions/events";

export type SessionEvent = BetaManagedAgentsSessionEvent;
export type StreamEvent = BetaManagedAgentsStreamSessionEvents;

export type RunStatus = "running" | "waiting" | "idle" | "ended";
export const RUN_STATUSES: readonly RunStatus[] = ["running", "waiting", "idle", "ended"];

export type ApiSessionStatus = "rescheduling" | "running" | "idle" | "terminated";

export type PermissionPolicy = "auto" | "always_ask" | "always_allow";

export interface AgentSummary {
  id: string;
  name: string;
  description: string | null;
  system: string | null;
  model: string;
  version: number;
  webAccess: boolean;
  permission: PermissionPolicy;
  updatedAt: string;
}

export interface AgentInput {
  name: string;
  description: string;
  system: string;
  model: string;
  webAccess: boolean;
  permission: PermissionPolicy;
  version?: number;
}

export interface RunSummary {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  repos: string[];
  status: RunStatus;
  stopReason: string | null;
  createdAt: string;
  lastActivityAt: string;
  finishedAt: string | null;
  seenAt: string | null;
}

export interface RunFilter {
  agentId?: string;
  status?: RunStatus;
}

export interface NewRunInput {
  agentId: string;
  repos: string[];
  message: string;
  title?: string;
}
