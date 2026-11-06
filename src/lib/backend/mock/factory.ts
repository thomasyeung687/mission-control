import type {
  BetaManagedAgentsAgentMessageEvent,
  BetaManagedAgentsAgentThinkingEvent,
  BetaManagedAgentsAgentToolResultEvent,
  BetaManagedAgentsAgentToolUseEvent,
  BetaManagedAgentsSessionStatusIdleEvent,
  BetaManagedAgentsSessionStatusRunningEvent,
  BetaManagedAgentsSessionStatusTerminatedEvent,
  BetaManagedAgentsSpanModelRequestEndEvent,
  BetaManagedAgentsSpanModelRequestStartEvent,
  BetaManagedAgentsUserInterruptEvent,
  BetaManagedAgentsUserMessageEvent,
  BetaManagedAgentsUserToolConfirmationEvent,
} from "@anthropic-ai/sdk/resources/beta/sessions/events";
import type {
  BetaManagedAgentsDeltaEvent,
  BetaManagedAgentsStartEvent,
} from "@anthropic-ai/sdk/resources/beta/sessions/sessions";

let counter = 0;

export function eventId(): string {
  counter += 1;
  return `sevt_mock${Date.now().toString(36)}${counter.toString(36).padStart(4, "0")}`;
}

export const ev = {
  userMessage(text: string, at: string | null): BetaManagedAgentsUserMessageEvent {
    return {
      id: eventId(),
      type: "user.message",
      content: [{ type: "text", text }],
      processed_at: at,
    };
  },
  agentMessage(text: string, at: string, id = eventId()): BetaManagedAgentsAgentMessageEvent {
    return { id, type: "agent.message", content: [{ type: "text", text }], processed_at: at };
  },
  thinking(at: string): BetaManagedAgentsAgentThinkingEvent {
    return { id: eventId(), type: "agent.thinking", processed_at: at };
  },
  toolUse(
    name: string,
    input: Record<string, unknown>,
    at: string,
    permission: "allow" | "ask" = "allow",
  ): BetaManagedAgentsAgentToolUseEvent {
    return {
      id: eventId(),
      type: "agent.tool_use",
      name,
      input,
      processed_at: at,
      evaluated_permission: permission,
    };
  },
  toolResult(
    toolUseId: string,
    text: string,
    at: string,
    isError = false,
  ): BetaManagedAgentsAgentToolResultEvent {
    return {
      id: eventId(),
      type: "agent.tool_result",
      tool_use_id: toolUseId,
      content: [{ type: "text", text }],
      is_error: isError,
      processed_at: at,
    };
  },
  confirmation(
    toolUseId: string,
    result: "allow" | "deny",
    at: string | null,
  ): BetaManagedAgentsUserToolConfirmationEvent {
    return {
      id: eventId(),
      type: "user.tool_confirmation",
      tool_use_id: toolUseId,
      result,
      processed_at: at,
    };
  },
  interrupt(at: string): BetaManagedAgentsUserInterruptEvent {
    return { id: eventId(), type: "user.interrupt", processed_at: at };
  },
  running(at: string): BetaManagedAgentsSessionStatusRunningEvent {
    return { id: eventId(), type: "session.status_running", processed_at: at };
  },
  idle(at: string, waitingOn: string[] = []): BetaManagedAgentsSessionStatusIdleEvent {
    return {
      id: eventId(),
      type: "session.status_idle",
      processed_at: at,
      stop_details: null,
      stop_reason: waitingOn.length
        ? { type: "requires_action", event_ids: waitingOn }
        : { type: "end_turn" },
    };
  },
  terminated(at: string): BetaManagedAgentsSessionStatusTerminatedEvent {
    return { id: eventId(), type: "session.status_terminated", processed_at: at };
  },
  requestStart(at: string): BetaManagedAgentsSpanModelRequestStartEvent {
    return { id: eventId(), type: "span.model_request_start", processed_at: at };
  },
  requestEnd(startId: string, at: string): BetaManagedAgentsSpanModelRequestEndEvent {
    return {
      id: eventId(),
      type: "span.model_request_end",
      is_error: false,
      model_request_start_id: startId,
      model_usage: {
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 4096,
        input_tokens: 1800,
        output_tokens: 420,
      },
      processed_at: at,
    };
  },
  previewStart(id: string): BetaManagedAgentsStartEvent {
    return { type: "event_start", event: { type: "agent.message", id } };
  },
  previewDelta(id: string, text: string): BetaManagedAgentsDeltaEvent {
    return {
      type: "event_delta",
      event_id: id,
      delta: { type: "content_delta", index: 0, content: { type: "text", text } },
    };
  },
};
