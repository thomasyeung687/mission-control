import { describe, expect, it } from "vitest";
import { ev } from "@/lib/backend/mock/factory";
import { chatItems, initialChatState, pendingConfirmations, reduceEvents } from "./reducer";

const at = "2026-11-06T10:00:00.000Z";

describe("chatReducer", () => {
  it("renders user and agent messages in order", () => {
    const state = reduceEvents([ev.userMessage("hi", at), ev.agentMessage("hello", at)]);
    expect(chatItems(state).map((i) => i.kind)).toEqual(["user", "agent"]);
  });

  it("marks a queued message processed when the same event arrives again", () => {
    const queued = ev.userMessage("later", null);
    const state = reduceEvents([queued, { ...queued, processed_at: at }]);
    const items = chatItems(state);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "user", queued: false });
  });

  it("is idempotent when history and live stream overlap", () => {
    const events = [ev.userMessage("a", at), ev.agentMessage("b", at), ev.idle(at)];
    const once = reduceEvents(events);
    const twice = reduceEvents(events, once);
    expect(chatItems(twice)).toEqual(chatItems(once));
  });

  it("attaches tool results to their tool call", () => {
    const use = ev.toolUse("bash", { command: "ls" }, at);
    const state = reduceEvents([use, ev.toolResult(use.id, "file.txt", at)]);
    expect(state.items[use.id]).toMatchObject({ kind: "tool", result: "file.txt", outcome: "ok" });
  });

  it("flags failing tool results as errors", () => {
    const use = ev.toolUse("bash", { command: "false" }, at);
    const state = reduceEvents([use, ev.toolResult(use.id, "exit 1", at, true)]);
    expect(state.items[use.id]).toMatchObject({ outcome: "error" });
  });

  it("accumulates live previews and replaces them with the final message", () => {
    const final = ev.agentMessage("Hello world", at);
    const mid = reduceEvents([
      ev.previewStart(final.id),
      ev.previewDelta(final.id, "Hello "),
      ev.previewDelta(final.id, "wor"),
    ]);
    expect(mid.previews[final.id]).toBe("Hello wor");
    const done = reduceEvents([final], mid);
    expect(done.previews).toEqual({});
    expect(done.items[final.id]).toMatchObject({ text: "Hello world" });
  });

  it("drops unreconciled previews when the model request ends", () => {
    const start = ev.requestStart(at);
    const state = reduceEvents([start, ev.previewStart("x"), ev.requestEnd(start.id, at)]);
    expect(state.previews).toEqual({});
  });

  it("tracks status from status events", () => {
    expect(reduceEvents([ev.running(at)]).status).toBe("running");
    expect(reduceEvents([ev.idle(at)]).status).toBe("idle");
    expect(reduceEvents([ev.idle(at, ["sevt_1"])]).status).toBe("waiting");
    expect(reduceEvents([ev.terminated(at)]).status).toBe("ended");
  });

  it("lists tool calls waiting for approval until they are answered", () => {
    const use = ev.toolUse("bash", { command: "git push" }, at, "ask");
    const waiting = reduceEvents([use, ev.idle(at, [use.id])]);
    expect(pendingConfirmations(waiting).map((t) => t.id)).toEqual([use.id]);
    const answered = reduceEvents([ev.confirmation(use.id, "deny", at)], waiting);
    expect(pendingConfirmations(answered)).toEqual([]);
    expect(answered.items[use.id]).toMatchObject({ confirmation: "deny", outcome: "denied" });
  });

  it("does not offer approval once the run is no longer waiting", () => {
    const use = ev.toolUse("bash", { command: "git push" }, at, "ask");
    const state = reduceEvents([use, ev.idle(at, [use.id]), ev.interrupt(at), ev.idle(at)]);
    expect(pendingConfirmations(state)).toEqual([]);
  });

  it("adds notices for errors and abnormal stops", () => {
    const state = reduceEvents([
      {
        id: "sevt_err",
        type: "session.error",
        processed_at: at,
        error: {
          type: "unknown_error",
          message: "boom",
          retry_status: { type: "exhausted" },
        },
      },
      ev.terminated(at),
    ]);
    const notices = chatItems(state).filter((i) => i.kind === "notice");
    expect(notices.map((n) => n.kind === "notice" && n.tone)).toEqual(["error", "info"]);
  });

  it("starts empty", () => {
    expect(chatItems(initialChatState)).toEqual([]);
  });
});
