import { describe, expect, it } from "vitest";
import { ev } from "@/lib/backend/mock/factory";
import { deriveRunStatus, describeStopReason, statusFromEvent } from "./status";

describe("deriveRunStatus", () => {
  it("maps API statuses to run statuses", () => {
    expect(deriveRunStatus("running", null)).toBe("running");
    expect(deriveRunStatus("rescheduling", null)).toBe("running");
    expect(deriveRunStatus("terminated", "end_turn")).toBe("ended");
    expect(deriveRunStatus("idle", "end_turn")).toBe("idle");
    expect(deriveRunStatus("idle", null)).toBe("idle");
  });

  it("treats idle with requires_action as waiting on you", () => {
    expect(deriveRunStatus("idle", "requires_action")).toBe("waiting");
  });
});

describe("statusFromEvent", () => {
  const at = "2026-11-06T10:00:00.000Z";
  it("ignores non-status events", () => {
    expect(statusFromEvent(ev.agentMessage("x", at))).toBeNull();
  });
  it("reads the stop reason of idle events", () => {
    expect(statusFromEvent(ev.idle(at, ["a"]))).toEqual({
      status: "waiting",
      stopReason: "requires_action",
    });
  });
});

describe("describeStopReason", () => {
  it("labels known reasons and passes unknown ones through", () => {
    expect(describeStopReason("budget_reached")).toBe("Paused at its budget");
    expect(describeStopReason("something_new")).toBe("something_new");
    expect(describeStopReason(null)).toBeNull();
  });
});
