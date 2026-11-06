import "server-only";
import type { BetaManagedAgentsSession } from "@anthropic-ai/sdk/resources/beta/sessions/sessions";
import { statusEventTypes } from "@/lib/run/status";
import { SEEN_METADATA_KEY, toRunSummary } from "@/lib/run/summary";
import { titleFromMessage } from "@/lib/run/text";
import type { NewRunInput, RunFilter, RunSummary, SessionEvent } from "@/lib/types";
import { anthropic, githubToken } from "./client";
import { environmentId } from "./environment";

const RUN_PAGE_SIZE = 50;

async function lastStatusEvent(sessionId: string): Promise<SessionEvent | null> {
  const page = await anthropic().beta.sessions.events.list(sessionId, {
    types: [...statusEventTypes],
    order: "desc",
    limit: 1,
  });
  return page.data[0] ?? null;
}

async function summarize(session: BetaManagedAgentsSession): Promise<RunSummary> {
  return toRunSummary(session, await lastStatusEvent(session.id));
}

export async function listRuns(filter: RunFilter = {}): Promise<RunSummary[]> {
  const page = await anthropic().beta.sessions.list({
    limit: RUN_PAGE_SIZE,
    ...(filter.agentId ? { agent_id: filter.agentId } : {}),
    ...(filter.status ? { statuses: [apiStatusFor(filter.status)] } : {}),
  });
  const runs = await Promise.all(page.data.map(summarize));
  return filter.status ? runs.filter((run) => run.status === filter.status) : runs;
}

function apiStatusFor(status: RunFilter["status"]) {
  if (status === "ended") return "terminated" as const;
  if (status === "running") return "running" as const;
  return "idle" as const;
}

export async function getRun(id: string): Promise<RunSummary> {
  return summarize(await anthropic().beta.sessions.retrieve(id));
}

export async function createRun(input: NewRunInput): Promise<RunSummary> {
  const token = input.repos.length ? githubToken() : "";
  const session = await anthropic().beta.sessions.create({
    agent: input.agentId,
    environment_id: await environmentId(),
    title: input.title?.trim() || titleFromMessage(input.message),
    resources: input.repos.map((repo) => ({
      type: "github_repository" as const,
      url: `https://github.com/${repo}`,
      authorization_token: token,
    })),
    initial_events: [{ type: "user.message", content: [{ type: "text", text: input.message }] }],
  });
  return summarize(session);
}

export async function markSeen(id: string): Promise<void> {
  const session = await anthropic().beta.sessions.retrieve(id);
  await anthropic().beta.sessions.update(id, {
    metadata: { ...session.metadata, [SEEN_METADATA_KEY]: new Date().toISOString() },
  });
}
