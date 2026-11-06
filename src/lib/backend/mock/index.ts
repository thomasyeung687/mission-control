import { SEEN_METADATA_KEY, toRunSummary } from "@/lib/run/summary";
import { titleFromMessage } from "@/lib/run/text";
import type { AgentInput, AgentSummary, NewRunInput, RunSummary, StreamEvent } from "@/lib/types";
import { BackendError, type Backend, type LiveStream } from "../types";
import { fixtureAgents } from "./agents";
import { fixtureRuns } from "./runs";
import { interruptRun, liveLoop, replyTo, resolveConfirmation } from "./simulate";
import { lastStatusEvent, type MockRun, type MockStore } from "./store";

const globalStore = globalThis as typeof globalThis & { __missionControlMock?: MockStore };

function store(): MockStore {
  if (!globalStore.__missionControlMock) {
    const created: MockStore = {
      agents: new Map(fixtureAgents().map((a) => [a.id, a])),
      runs: new Map(fixtureRuns().map((r) => [r.id, r])),
    };
    globalStore.__missionControlMock = created;
    for (const run of created.runs.values()) if (run.live) void liveLoop(run);
  }
  return globalStore.__missionControlMock;
}

function agentOf(id: string): AgentSummary {
  const agent = store().agents.get(id);
  if (!agent) throw new BackendError(`Agent ${id} not found`, 404);
  return agent;
}

function runOf(id: string): MockRun {
  const run = store().runs.get(id);
  if (!run) throw new BackendError(`Run ${id} not found`, 404);
  return run;
}

function summarize(run: MockRun): RunSummary {
  const agent = store().agents.get(run.agentId);
  const session = {
    id: run.id,
    title: run.title,
    status: run.apiStatus,
    created_at: run.createdAt,
    updated_at: run.updatedAt,
    metadata: run.metadata,
    agent: { id: run.agentId, name: agent?.name ?? "Unknown agent" },
    resources: run.repos.map((repo) => ({
      type: "github_repository",
      url: `https://github.com/${repo}`,
    })),
  };
  return toRunSummary(session, lastStatusEvent(run));
}

function saveAgent(id: string, input: AgentInput, version: number): AgentSummary {
  const agent: AgentSummary = {
    id,
    version,
    name: input.name,
    description: input.description || null,
    system: input.system || null,
    model: input.model,
    webAccess: input.webAccess,
    permission: input.permission,
    updatedAt: new Date().toISOString(),
  };
  store().agents.set(id, agent);
  return agent;
}

function openStream(runId: string): Promise<LiveStream> {
  const run = runOf(runId);
  const queue: StreamEvent[] = [];
  let wake: (() => void) | null = null;
  let closed = false;
  const listener = (event: StreamEvent) => {
    queue.push(event);
    wake?.();
  };
  run.listeners.add(listener);
  const close = () => {
    closed = true;
    run.listeners.delete(listener);
    wake?.();
  };
  async function* iterate(): AsyncGenerator<StreamEvent> {
    while (!closed) {
      const next = queue.shift();
      if (next) yield next;
      else await new Promise<void>((resolve) => (wake = resolve));
    }
  }
  return Promise.resolve({ [Symbol.asyncIterator]: iterate, close });
}

export const mockBackend: Backend = {
  mode: "mock",
  listAgents: async () => [...store().agents.values()].sort((a, b) => a.name.localeCompare(b.name)),
  getAgent: async (id) => agentOf(id),
  createAgent: async (input) => saveAgent(`agent_mock_${Date.now().toString(36)}`, input, 1),
  async updateAgent(id, input) {
    const current = agentOf(id);
    if (input.version !== undefined && input.version !== current.version) {
      throw new BackendError("This agent changed since you opened it. Reload and try again.", 409);
    }
    return saveAgent(id, input, current.version + 1);
  },
  async listRuns(filter = {}) {
    return [...store().runs.values()]
      .map(summarize)
      .filter((run) => !filter.agentId || run.agentId === filter.agentId)
      .filter((run) => !filter.status || run.status === filter.status)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },
  getRun: async (id) => summarize(runOf(id)),
  async createRun(input: NewRunInput) {
    agentOf(input.agentId);
    const now = new Date().toISOString();
    const run: MockRun = {
      id: `sesn_mock_${Date.now().toString(36)}`,
      title: input.title?.trim() || titleFromMessage(input.message),
      agentId: input.agentId,
      repos: input.repos,
      apiStatus: "idle",
      createdAt: now,
      updatedAt: now,
      metadata: {},
      events: [],
      listeners: new Set(),
      generation: 0,
      live: false,
    };
    store().runs.set(run.id, run);
    void replyTo(run, input.message);
    return summarize(run);
  },
  listEvents: async (runId) => [...runOf(runId).events],
  openStream,
  async sendMessage(runId, text) {
    const run = runOf(runId);
    if (run.apiStatus === "terminated") throw new BackendError("This run has ended.", 400);
    void replyTo(run, text);
  },
  interrupt: async (runId) => interruptRun(runOf(runId)),
  async confirmTool(runId, toolUseId, allow) {
    void resolveConfirmation(runOf(runId), toolUseId, allow);
  },
  async markSeen(runId) {
    const run = runOf(runId);
    run.metadata = { ...run.metadata, [SEEN_METADATA_KEY]: new Date().toISOString() };
  },
};
