import "server-only";
import type { BetaManagedAgentsSession } from "@anthropic-ai/sdk/resources/beta/sessions/sessions";
import { statusEventTypes } from "@/lib/run/status";
import { SEEN_METADATA_KEY, toRunSummary } from "@/lib/run/summary";
import { titleFromMessage } from "@/lib/run/text";
import type { NewRunInput, RunFilter, RunSummary, SessionEvent } from "@/lib/types";
import { anthropic, githubToken } from "./client";
import { environmentId } from "./environment";

const RUN_PAGE_SIZE = 50;

interface CachedStatus {
  updatedAt: string;
  fetchedAt: number;
  event: SessionEvent | null;
}

const statusCache = new Map<string, CachedStatus>();
const STATUS_CACHE_LIMIT = 500;
const STATUS_CACHE_TTL_MS = 60_000;

async function fetchLastStatusEvent(sessionId: string): Promise<SessionEvent | null> {
  const page = await anthropic().beta.sessions.events.list(sessionId, {
    types: [...statusEventTypes],
    order: "desc",
    limit: 1,
  });
  return page.data[0] ?? null;
}

async function lastStatusEvent(session: BetaManagedAgentsSession): Promise<SessionEvent | null> {
  if (session.status === "running" || session.status === "rescheduling") return null;
  const cached = statusCache.get(session.id);
  const fresh = cached && Date.now() - cached.fetchedAt < STATUS_CACHE_TTL_MS;
  if (fresh && cached.updatedAt === session.updated_at) return cached.event;
  const event = await fetchLastStatusEvent(session.id);
  if (statusCache.size >= STATUS_CACHE_LIMIT) statusCache.clear();
  statusCache.set(session.id, { updatedAt: session.updated_at, fetchedAt: Date.now(), event });
  return event;
}

async function summarize(session: BetaManagedAgentsSession): Promise<RunSummary> {
  return toRunSummary(session, await lastStatusEvent(session));
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
