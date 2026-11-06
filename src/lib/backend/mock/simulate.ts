import { ev, eventId } from "./factory";
import { emit, type MockRun } from "./store";

const now = () => new Date().toISOString();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Step = (run: MockRun) => void;

async function play(run: MockRun, steps: Array<[number, Step]>): Promise<void> {
  const generation = run.generation;
  for (const [delay, step] of steps) {
    await sleep(delay);
    if (run.generation !== generation) return;
    step(run);
  }
}

function streamedMessage(text: string): Array<[number, Step]> {
  const id = eventId();
  const chunks = text.match(/.{1,24}(\s|$)/gs) ?? [text];
  return [
    [300, (run) => emit(run, ev.previewStart(id))],
    ...chunks.map((chunk): [number, Step] => [90, (run) => emit(run, ev.previewDelta(id, chunk))]),
    [200, (run) => emit(run, ev.agentMessage(text, now(), id))],
  ];
}

function tool(name: string, input: Record<string, unknown>, output: string): Array<[number, Step]> {
  let useId = "";
  return [
    [
      700,
      (run) => {
        const use = ev.toolUse(name, input, now());
        useId = use.id;
        emit(run, use);
      },
    ],
    [900, (run) => emit(run, ev.toolResult(useId, output, now()))],
  ];
}

function turn(body: Array<[number, Step]>): Array<[number, Step]> {
  let startId = "";
  return [
    [400, (run) => emit(run, ev.running(now()))],
    [
      200,
      (run) => {
        const start = ev.requestStart(now());
        startId = start.id;
        emit(run, start);
      },
    ],
    [300, (run) => emit(run, ev.thinking(now()))],
    ...body,
    [100, (run) => emit(run, ev.requestEnd(startId, now()))],
    [200, (run) => emit(run, ev.idle(now()))],
  ];
}

export function replyTo(run: MockRun, message: string): Promise<void> {
  const user = ev.userMessage(message, null);
  emit(run, user);
  run.live = false;
  return play(run, [
    [250, (r) => emit(r, { ...user, processed_at: now() })],
    ...turn([
      ...tool(
        "grep",
        { pattern: keyword(message), path: "." },
        "app/round/[id].tsx:42\nlib/round/store.ts:17",
      ),
      ...streamedMessage(
        `On it. I looked at where this lives (\`app/round/[id].tsx\` and \`lib/round/store.ts\`) and I'll keep the change inside those two files.\n\nI'll report back with a branch name and test results.`,
      ),
    ]),
  ]);
}

function keyword(message: string): string {
  return message.split(/\W+/).find((word) => word.length > 4) ?? "round";
}

export function resolveConfirmation(
  run: MockRun,
  toolUseId: string,
  allow: boolean,
): Promise<void> {
  emit(run, ev.confirmation(toolUseId, allow ? "allow" : "deny", now()));
  const outcome: Array<[number, Step]> = allow
    ? [
        [
          600,
          (r: MockRun) =>
            emit(
              r,
              ev.toolResult(
                toolUseId,
                "To github.com:thomasyeung687/golf-native.git\n * [new branch] review/scorecard-sync-fixes",
                now(),
              ),
            ),
        ],
        ...streamedMessage(
          "Pushed `review/scorecard-sync-fixes`. The branch has the fix and a regression test.",
        ),
      ]
    : streamedMessage(
        "Understood — I won't push. The fix is committed locally if you want it later.",
      );
  return play(run, turn(outcome));
}

export function interruptRun(run: MockRun): void {
  run.generation += 1;
  run.live = false;
  emit(run, ev.interrupt(now()));
  emit(run, ev.idle(now()));
}

const LIVE_STEPS: Array<[string, Record<string, unknown>, string]> = [
  ["read", { file_path: "components/ShotMarker.tsx" }, "export function ShotMarker() { … }"],
  ["edit", { file_path: "components/ShotMarker.tsx" }, "Applied 1 edit"],
  ["bash", { command: "npx tsc --noEmit" }, "No errors"],
  [
    "bash",
    { command: "npx jest components/ShotMarker.test.tsx" },
    "PASS  ✓ renders distance label",
  ],
];

export async function liveLoop(run: MockRun): Promise<void> {
  let index = 0;
  while (run.live && run.apiStatus === "running") {
    const [name, input, output] = LIVE_STEPS[index % LIVE_STEPS.length]!;
    await play(run, [[3500, () => undefined], ...tool(name, input, output)]);
    index += 1;
  }
}
