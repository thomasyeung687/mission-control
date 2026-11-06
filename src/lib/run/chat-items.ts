export type ToolOutcome = "pending" | "ok" | "error" | "denied";

export interface UserItem {
  kind: "user";
  id: string;
  text: string;
  queued: boolean;
  at: string | null;
}

export interface AgentItem {
  kind: "agent";
  id: string;
  text: string;
  at: string | null;
}

export interface ToolItem {
  kind: "tool";
  id: string;
  name: string;
  server: string | null;
  custom: boolean;
  input: Record<string, unknown>;
  permission: "allow" | "ask" | "deny" | null;
  confirmation: "allow" | "deny" | null;
  result: string | null;
  outcome: ToolOutcome;
  at: string | null;
}

export interface NoticeItem {
  kind: "notice";
  id: string;
  tone: "info" | "error";
  text: string;
  at: string | null;
}

export type ChatItem = UserItem | AgentItem | ToolItem | NoticeItem;
