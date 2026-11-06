import type { RunStatus, StreamEvent } from "@/lib/types";
import type { ChatItem, ToolItem } from "./chat-items";
import { describeStopReason, statusFromEvent } from "./status";
import { blocksToText, errorMessage } from "./text";

export interface ChatState {
  order: string[];
  items: Record<string, ChatItem>;
  status: RunStatus | null;
  stopReason: string | null;
  previews: Record<string, string>;
  toolIdsByUseId: Record<string, string>;
}

export const initialChatState: ChatState = {
  order: [],
  items: {},
  status: null,
  stopReason: null,
  previews: {},
  toolIdsByUseId: {},
};

function upsert(state: ChatState, item: ChatItem): ChatState {
  const exists = item.id in state.items;
  return {
    ...state,
    order: exists ? state.order : [...state.order, item.id],
    items: { ...state.items, [item.id]: item },
  };
}

function patchTool(state: ChatState, toolId: string, patch: Partial<ToolItem>): ChatState {
  const existing = state.items[toolId];
  if (!existing || existing.kind !== "tool") return state;
  return { ...state, items: { ...state.items, [toolId]: { ...existing, ...patch } } };
}

function withoutPreview(state: ChatState, id: string): ChatState {
  if (!(id in state.previews)) return state;
  const previews = { ...state.previews };
  delete previews[id];
  return { ...state, previews };
}

function applyStatus(state: ChatState, event: StreamEvent): ChatState {
  const snapshot = statusFromEvent(event);
  if (!snapshot) return state;
  const next = { ...state, status: snapshot.status, stopReason: snapshot.stopReason };
  const id = "id" in event ? event.id : "";
  const at = "processed_at" in event ? (event.processed_at ?? null) : null;
  if (event.type === "session.status_terminated") {
    return upsert(next, { kind: "notice", id, tone: "info", text: "Run ended", at });
  }
  const reason = snapshot.stopReason;
  if (reason && reason !== "end_turn" && reason !== "requires_action") {
    const tone = reason === "retries_exhausted" ? "error" : "info";
    return upsert(next, {
      kind: "notice",
      id,
      tone,
      text: describeStopReason(reason) ?? reason,
      at,
    });
  }
  return next;
}

function toolItem(
  id: string,
  name: string,
  input: Record<string, unknown>,
  at: string,
  extra: Partial<ToolItem>,
): ToolItem {
  return {
    kind: "tool",
    id,
    name,
    input,
    at,
    server: null,
    custom: false,
    permission: null,
    confirmation: null,
    result: null,
    outcome: "pending",
    ...extra,
  };
}

function resultFor(state: ChatState, useId: string, text: string, isError: boolean): ChatState {
  const toolId = state.toolIdsByUseId[useId] ?? useId;
  return patchTool(state, toolId, { result: text, outcome: isError ? "error" : "ok" });
}

function registerTool(state: ChatState, item: ToolItem): ChatState {
  const next = upsert(state, item);
  return { ...next, toolIdsByUseId: { ...next.toolIdsByUseId, [item.id]: item.id } };
}

function applyContent(state: ChatState, event: StreamEvent): ChatState {
  switch (event.type) {
    case "user.message":
      return upsert(state, {
        kind: "user",
        id: event.id,
        text: blocksToText(event.content),
        queued: event.processed_at == null,
        at: event.processed_at ?? null,
      });
    case "agent.message":
      return upsert(withoutPreview(state, event.id), {
        kind: "agent",
        id: event.id,
        text: blocksToText(event.content),
        at: event.processed_at,
      });
    case "agent.tool_use":
      return registerTool(
        state,
        toolItem(event.id, event.name, event.input, event.processed_at, {
          permission: event.evaluated_permission ?? null,
          outcome: event.evaluated_permission === "deny" ? "denied" : "pending",
        }),
      );
    case "agent.mcp_tool_use":
      return registerTool(
        state,
        toolItem(event.id, event.name, event.input, event.processed_at, {
          server: event.mcp_server_name,
          permission: event.evaluated_permission ?? null,
          outcome: event.evaluated_permission === "deny" ? "denied" : "pending",
        }),
      );
    case "agent.custom_tool_use":
      return registerTool(
        state,
        toolItem(event.id, event.name, event.input, event.processed_at, { custom: true }),
      );
    case "agent.tool_result":
      return resultFor(
        state,
        event.tool_use_id,
        blocksToText(event.content ?? []),
        !!event.is_error,
      );
    case "agent.mcp_tool_result":
      return resultFor(
        state,
        event.mcp_tool_use_id,
        blocksToText(event.content ?? []),
        !!event.is_error,
      );
    case "user.tool_confirmation":
      return patchTool(state, event.tool_use_id, {
        confirmation: event.result,
        ...(event.result === "deny" ? { outcome: "denied" as const } : {}),
      });
    default:
      return state;
  }
}

function applyMeta(state: ChatState, event: StreamEvent): ChatState {
  switch (event.type) {
    case "event_start":
      if (event.event.type !== "agent.message" || event.event.id in state.items) return state;
      return { ...state, previews: { ...state.previews, [event.event.id]: "" } };
    case "event_delta": {
      if (!(event.event_id in state.previews)) return state;
      const text = (state.previews[event.event_id] ?? "") + event.delta.content.text;
      return { ...state, previews: { ...state.previews, [event.event_id]: text } };
    }
    case "span.model_request_end":
      return Object.keys(state.previews).length ? { ...state, previews: {} } : state;
    case "user.interrupt":
      return upsert(state, {
        kind: "notice",
        id: event.id || `interrupt-${event.processed_at ?? "pending"}`,
        tone: "info",
        text: "You interrupted the agent",
        at: event.processed_at ?? null,
      });
    case "session.error":
      return upsert(state, {
        kind: "notice",
        id: event.id,
        tone: "error",
        text: errorMessage(event.error),
        at: event.processed_at,
      });
    default:
      return state;
  }
}

export function chatReducer(state: ChatState, event: StreamEvent): ChatState {
  return applyMeta(applyContent(applyStatus(state, event), event), event);
}

export function reduceEvents(events: readonly StreamEvent[], from = initialChatState): ChatState {
  return events.reduce(chatReducer, from);
}

export function pendingConfirmations(state: ChatState): ToolItem[] {
  if (state.status !== "waiting") return [];
  return state.order
    .map((id) => state.items[id])
    .filter(
      (item): item is ToolItem =>
        item?.kind === "tool" && item.permission === "ask" && item.confirmation === null,
    );
}

export function chatItems(state: ChatState): ChatItem[] {
  return state.order.map((id) => state.items[id]).filter((item): item is ChatItem => !!item);
}
