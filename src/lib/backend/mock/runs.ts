import type { StreamEvent } from "@/lib/types";
import { ev } from "./factory";
import type { MockRun } from "./store";

class Clock {
  private ms: number;
  constructor(minutesAgo: number) {
    this.ms = Date.now() - minutesAgo * 60_000;
  }
  tick(seconds = 25): string {
    this.ms += seconds * 1000;
    return new Date(this.ms).toISOString();
  }
}

function toolPair(clock: Clock, name: string, input: Record<string, unknown>, output: string) {
  const use = ev.toolUse(name, input, clock.tick(8));
  return [use, ev.toolResult(use.id, output, clock.tick(4))];
}

function opening(clock: Clock, ask: string): StreamEvent[] {
  return [
    ev.userMessage(ask, clock.tick(0)),
    ev.running(clock.tick(1)),
    ev.thinking(clock.tick(6)),
  ];
}

function run(
  id: string,
  title: string,
  agentId: string,
  minutesAgo: number,
  build: (clock: Clock) => StreamEvent[],
  extra: Partial<MockRun> = {},
): MockRun {
  const clock = new Clock(minutesAgo);
  const createdAt = clock.tick(0);
  const events = build(clock);
  return {
    id,
    title,
    agentId,
    repos: ["thomasyeung687/golf-native"],
    apiStatus: "idle",
    createdAt,
    updatedAt: createdAt,
    metadata: {},
    events,
    listeners: new Set(),
    generation: 0,
    live: false,
    ...extra,
  };
}

const LS_OUTPUT = "app/\ncomponents/\nhooks/\nlib/\npackage.json\napp.json\ntsconfig.json";

function shotMap(clock: Clock): StreamEvent[] {
  return [
    ...opening(
      clock,
      "Add a shot-tracking map to the round screen: tap to drop a shot marker, show distance to the pin.",
    ),
    ...toolPair(clock, "bash", { command: "ls" }, LS_OUTPUT),
    ...toolPair(
      clock,
      "read",
      { file_path: "app/round/[id].tsx" },
      "export default function RoundScreen() {\n  …\n}",
    ),
    ev.agentMessage(
      "The round screen already renders a `MapView` for the hole flyover, so I'll layer markers on it rather than adding a second map.\n\nPlan:\n1. `useShotMarkers` hook that stores markers per hole in the round store\n2. `ShotMarker` component with distance label\n3. Haversine distance to the pin, in yards or metres from settings",
      clock.tick(12),
    ),
    ...toolPair(clock, "write", { file_path: "hooks/useShotMarkers.ts" }, "Wrote 64 lines"),
    ...toolPair(
      clock,
      "bash",
      { command: "npx jest hooks/useShotMarkers.test.ts" },
      "PASS hooks/useShotMarkers.test.ts\n  ✓ adds a marker (4 ms)\n  ✓ computes yards to pin (2 ms)",
    ),
  ];
}

function prReview(clock: Clock): StreamEvent[] {
  const push = ev.toolUse(
    "bash",
    { command: "git push origin review/scorecard-sync-fixes" },
    clock.tick(30),
    "ask",
  );
  return [
    ...opening(
      clock,
      "Review the scorecard offline-sync branch (feat/scorecard-sync) and push any fixes to a review branch.",
    ),
    ...toolPair(
      clock,
      "bash",
      { command: "git diff main...feat/scorecard-sync --stat" },
      " lib/sync/queue.ts | 142 +++++++\n lib/sync/merge.ts |  58 +++\n 2 files changed, 200 insertions(+)",
    ),
    ...toolPair(
      clock,
      "grep",
      { pattern: "await .*\\.forEach", path: "lib/sync" },
      "lib/sync/queue.ts:88:    await pending.forEach(async (op) => {",
    ),
    ev.agentMessage(
      "Found a real bug: `await pending.forEach(async …)` in `lib/sync/queue.ts:88` doesn't wait for the writes, so a scorecard edited offline can be marked synced before it uploads.\n\nI fixed it with a sequential `for…of` loop, added a test that fails on the old code, and committed to `review/scorecard-sync-fixes`. Pushing it needs your approval.",
      clock.tick(40),
    ),
    push,
    ev.idle(clock.tick(2), [push.id]),
  ];
}

function handicapQa(clock: Clock): StreamEvent[] {
  return [
    ...opening(
      clock,
      "Run a regression pass on the handicap calculator after the WHS 2024 rules change.",
    ),
    ...toolPair(
      clock,
      "bash",
      { command: "npx jest lib/handicap" },
      "Tests: 2 failed, 31 passed, 33 total",
    ),
    ev.agentMessage(
      "**2 regressions found** in `lib/handicap/differential.ts`:\n\n- Playing conditions calculation isn't applied when fewer than 8 scores exist\n- Net double bogey cap uses course handicap instead of playing handicap\n\nBoth have failing tests on `qa/handicap-regressions`. Everything else (31 cases) passes.",
      clock.tick(50),
    ),
    ev.idle(clock.tick(2)),
  ];
}

function clubSheet(clock: Clock): StreamEvent[] {
  return [
    ...opening(clock, "Redesign the club selection bottom sheet so it works one-handed."),
    ...toolPair(clock, "read", { file_path: "components/ClubSheet.tsx" }, "…"),
    ev.agentMessage(
      "Moved the club grid to the bottom 40% of the sheet, made targets 56pt, and put the last-used club first. Branch: `design/club-sheet-one-hand`.",
      clock.tick(60),
    ),
    ev.idle(clock.tick(2)),
  ];
}

function gpsDrift(clock: Clock): StreamEvent[] {
  return [
    ...opening(clock, "Fix GPS drift on the hole 7 flyover at Pebble Creek."),
    ...toolPair(clock, "bash", { command: "npx jest lib/geo" }, "Tests: 18 passed, 18 total"),
    ev.agentMessage(
      "The drift came from mixing WGS84 tee coordinates with a projected green polygon. Normalised both to WGS84 and added a fixture for hole 7. Pushed `fix/hole-7-drift`.",
      clock.tick(45),
    ),
    ev.idle(clock.tick(2)),
    ev.terminated(clock.tick(600)),
  ];
}

function onboardingTests(clock: Clock): StreamEvent[] {
  return [
    ...opening(clock, "Write Detox tests for onboarding."),
    ...toolPair(clock, "write", { file_path: "e2e/onboarding.test.ts" }, "Wrote 120 lines"),
    ev.agentMessage(
      "Added 6 Detox cases covering sign-up, home course picker and permissions.",
      clock.tick(30),
    ),
    ev.idle(clock.tick(2)),
    ev.terminated(clock.tick(300)),
  ];
}

export function fixtureRuns(): MockRun[] {
  const seenLongAgo = { mc_seen_at: new Date().toISOString() };
  return [
    run(
      "sesn_mock_shotmap",
      "Add shot-tracking map to round screen",
      "agent_mock_engineer",
      14,
      shotMap,
      { apiStatus: "running", live: true },
    ),
    run("sesn_mock_review", "Review scorecard offline sync", "agent_mock_reviewer", 52, prReview),
    run(
      "sesn_mock_handicap",
      "Regression pass on handicap calculator",
      "agent_mock_qa",
      95,
      handicapQa,
    ),
    run(
      "sesn_mock_clubsheet",
      "Redesign club selection sheet",
      "agent_mock_designer",
      180,
      clubSheet,
      { metadata: seenLongAgo },
    ),
    run("sesn_mock_gps", "Fix GPS drift on hole 7 flyover", "agent_mock_engineer", 400, gpsDrift),
    run(
      "sesn_mock_detox",
      "Write Detox tests for onboarding",
      "agent_mock_qa",
      1500,
      onboardingTests,
      { metadata: seenLongAgo },
    ),
  ].map(syncStatus);
}

function syncStatus(mock: MockRun): MockRun {
  const last = [...mock.events].reverse().find((e) => e.type.startsWith("session.status_"));
  const apiStatus =
    last?.type === "session.status_terminated"
      ? "terminated"
      : last?.type === "session.status_idle"
        ? "idle"
        : "running";
  const lastAt = [...mock.events].reverse().find((e) => "processed_at" in e && e.processed_at);
  const updatedAt =
    lastAt && "processed_at" in lastAt ? (lastAt.processed_at ?? mock.updatedAt) : mock.updatedAt;
  return { ...mock, apiStatus, updatedAt };
}
