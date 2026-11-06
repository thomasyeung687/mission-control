import "server-only";
import type { BetaManagedAgentsEventParams } from "@anthropic-ai/sdk/resources/beta/sessions/events";
import type { StreamEvent } from "@/lib/types";
import type { LiveStream } from "../types";
import { anthropic } from "./client";

export async function listEvents(runId: string): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of anthropic().beta.sessions.events.list(runId)) events.push(event);
  return events;
}

export async function openStream(runId: string): Promise<LiveStream> {
  const stream = await anthropic().beta.sessions.events.stream(runId, {
    event_deltas: ["agent.message"],
  });
  return {
    [Symbol.asyncIterator]: () => stream[Symbol.asyncIterator](),
    close: () => stream.controller.abort(),
  };
}

async function send(runId: string, events: BetaManagedAgentsEventParams[]): Promise<void> {
  await anthropic().beta.sessions.events.send(runId, { events });
}

export function sendMessage(runId: string, text: string): Promise<void> {
  return send(runId, [{ type: "user.message", content: [{ type: "text", text }] }]);
}

export function interrupt(runId: string): Promise<void> {
  return send(runId, [{ type: "user.interrupt" }]);
}

export function confirmTool(
  runId: string,
  toolUseId: string,
  allow: boolean,
  denyMessage?: string,
): Promise<void> {
  return send(runId, [
    {
      type: "user.tool_confirmation",
      tool_use_id: toolUseId,
      result: allow ? "allow" : "deny",
      ...(!allow && denyMessage ? { deny_message: denyMessage } : {}),
    },
  ]);
}
