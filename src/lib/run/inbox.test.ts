import { describe, expect, it } from "vitest";
import type { RunSummary } from "@/lib/types";
import { buildInbox, inboxReason } from "./inbox";

function run(overrides: Partial<RunSummary>): RunSummary {
  return {
    id: "sesn_1",
    title: "Run",
    agentId: "agent_1",
    agentName: "Engineer",
    repos: [],
    status: "idle",
    stopReason: "end_turn",
    createdAt: "2026-11-06T09:00:00.000Z",
    lastActivityAt: "2026-11-06T10:00:00.000Z",
    finishedAt: "2026-11-06T10:00:00.000Z",
    seenAt: null,
    ...overrides,
  };
}

describe("inboxReason", () => {
  it("always includes runs waiting on you", () => {
    expect(inboxReason(run({ status: "waiting", seenAt: "2026-11-07T00:00:00.000Z" }))).toBe(
      "waiting",
    );
  });

  it("includes finished runs never looked at", () => {
    expect(inboxReason(run({}))).toBe("finished");
    expect(inboxReason(run({ status: "ended" }))).toBe("finished");
  });

  it("includes runs that finished after you last looked", () => {
    expect(inboxReason(run({ seenAt: "2026-11-06T09:30:00.000Z" }))).toBe("finished");
  });

  it("excludes runs you have seen since they finished", () => {
    expect(inboxReason(run({ seenAt: "2026-11-06T10:05:00.000Z" }))).toBeNull();
  });

  it("excludes running runs and runs that never finished a turn", () => {
    expect(inboxReason(run({ status: "running", finishedAt: null }))).toBeNull();
    expect(inboxReason(run({ finishedAt: null }))).toBeNull();
  });
});

describe("buildInbox", () => {
  it("puts waiting runs first, then the most recently finished", () => {
    const entries = buildInbox([
      run({ id: "old", finishedAt: "2026-11-06T08:00:00.000Z" }),
      run({ id: "running", status: "running", finishedAt: null }),
      run({ id: "new", finishedAt: "2026-11-06T11:00:00.000Z" }),
      run({ id: "wait", status: "waiting", finishedAt: null }),
    ]);
    expect(entries.map((e) => e.run.id)).toEqual(["wait", "new", "old"]);
  });
});
