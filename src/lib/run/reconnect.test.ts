import { describe, expect, it } from "vitest";
import { ev } from "@/lib/backend/mock/factory";
import type { StreamEvent } from "@/lib/types";
import { consolidate } from "./reconnect";

async function* fromArray(events: StreamEvent[]): AsyncGenerator<StreamEvent> {
  yield* events;
}

async function collect(source: AsyncIterable<StreamEvent>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const event of source) out.push(event);
  return out;
}

const at = "2026-11-06T10:00:00.000Z";

describe("consolidate", () => {
  it("replays history then live events, dropping duplicates", async () => {
    const a = ev.userMessage("a", at);
    const b = ev.agentMessage("b", at);
    const c = ev.idle(at);
    const out = await collect(consolidate(fromArray([b, c]), async () => [a, b]));
    expect(out.map((e) => ("id" in e ? e.id : e.type))).toEqual([a.id, b.id, c.id]);
  });

  it("keeps both the queued and processed sightings of a user message", async () => {
    const queued = ev.userMessage("q", null);
    const processed = { ...queued, processed_at: at };
    const out = await collect(consolidate(fromArray([queued, processed]), async () => [queued]));
    expect(out).toEqual([queued, processed]);
  });

  it("stops after a terminated event in history", async () => {
    const never = (async function* () {
      await new Promise(() => undefined);
      yield ev.idle(at);
    })();
    const out = await collect(consolidate(never, async () => [ev.terminated(at)]));
    expect(out).toHaveLength(1);
  });

  it("passes preview deltas through without dedupe", async () => {
    const delta = ev.previewDelta("x", "hi");
    const out = await collect(consolidate(fromArray([delta, delta]), async () => []));
    expect(out).toHaveLength(2);
  });
});
