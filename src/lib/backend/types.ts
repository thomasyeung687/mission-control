import type {
  AgentInput,
  AgentSummary,
  NewRunInput,
  RunFilter,
  RunSummary,
  StreamEvent,
} from "@/lib/types";

export interface LiveStream extends AsyncIterable<StreamEvent> {
  close(): void;
}

export interface Backend {
  readonly mode: "mock" | "live";
  listAgents(): Promise<AgentSummary[]>;
  getAgent(id: string): Promise<AgentSummary>;
  createAgent(input: AgentInput): Promise<AgentSummary>;
  updateAgent(id: string, input: AgentInput): Promise<AgentSummary>;
  listRuns(filter?: RunFilter): Promise<RunSummary[]>;
  getRun(id: string): Promise<RunSummary>;
  createRun(input: NewRunInput): Promise<RunSummary>;
  listEvents(runId: string): Promise<StreamEvent[]>;
  openStream(runId: string): Promise<LiveStream>;
  sendMessage(runId: string, text: string): Promise<void>;
  interrupt(runId: string): Promise<void>;
  confirmTool(
    runId: string,
    toolUseId: string,
    allow: boolean,
    denyMessage?: string,
  ): Promise<void>;
  markSeen(runId: string): Promise<void>;
}

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BackendError";
  }
}
