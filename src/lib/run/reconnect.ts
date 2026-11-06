import type { StreamEvent } from "@/lib/types";

const TERMINAL_IDLE = new Set(["end_turn", "retries_exhausted", "budget_reached", "refusal"]);

export function eventKey(event: StreamEvent): string | null {
  if (event.type === "event_start" || event.type === "event_delta") return null;
  if (event.type === "user.message" || event.type === "user.tool_confirmation") {
    return `${event.id}:${event.processed_at ? "done" : "queued"}`;
  }
  return event.id || null;
}

export function isTerminal(event: StreamEvent): boolean {
  return event.type === "session.status_terminated";
}

export function isRestingIdle(event: StreamEvent): boolean {
  return event.type === "session.status_idle" && TERMINAL_IDLE.has(event.stop_reason.type);
}

/**
 * Lossless reconnect: the live stream must already be open before history is fetched,
 * so nothing emitted in between is lost; history is replayed first and duplicates are dropped.
 */
export async function* consolidate(
  live: AsyncIterable<StreamEvent>,
  history: () => Promise<StreamEvent[]>,
): AsyncGenerator<StreamEvent> {
  const seen = new Set<string>();
  const remember = (event: StreamEvent): boolean => {
    const key = eventKey(event);
    if (key === null) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
  let ended = false;
  for (const event of await history()) {
    if (remember(event)) yield event;
    ended ||= isTerminal(event);
  }
  if (ended) return;
  for await (const event of live) {
    if (remember(event)) yield event;
    if (isTerminal(event)) return;
  }
}
