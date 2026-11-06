import { DEFAULT_MODEL } from "@/lib/agent-config";
import { normalizeRepo } from "@/lib/run/text";
import {
  RUN_STATUSES,
  type AgentInput,
  type NewRunInput,
  type PermissionPolicy,
  type RunFilter,
  type RunStatus,
} from "@/lib/types";

export class ValidationError extends Error {}

type Json = Record<string, unknown>;

function asObject(body: unknown): Json {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Expected a JSON object");
  }
  return body as Json;
}

function text(body: Json, key: string, { required = false, max = 100_000 } = {}): string {
  const value = body[key];
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${key} is required`);
    return "";
  }
  if (typeof value !== "string") throw new ValidationError(`${key} must be a string`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${key} is required`);
  if (trimmed.length > max) throw new ValidationError(`${key} is too long`);
  return trimmed;
}

const PERMISSIONS: readonly PermissionPolicy[] = ["auto", "always_ask", "always_allow"];

export function parseAgentInput(raw: unknown): AgentInput {
  const body = asObject(raw);
  const permission = text(body, "permission") || "auto";
  if (!PERMISSIONS.includes(permission as PermissionPolicy)) {
    throw new ValidationError("permission is invalid");
  }
  const version = body.version;
  return {
    name: text(body, "name", { required: true, max: 256 }),
    description: text(body, "description", { max: 2048 }),
    system: text(body, "system"),
    model: text(body, "model", { max: 100 }) || DEFAULT_MODEL,
    webAccess: body.webAccess === true,
    permission: permission as PermissionPolicy,
    ...(typeof version === "number" ? { version } : {}),
  };
}

export function parseNewRun(raw: unknown, defaultOwner?: string): NewRunInput {
  const body = asObject(raw);
  const repos = Array.isArray(body.repos) ? body.repos : [];
  const parsed = repos.map((repo) =>
    typeof repo === "string" ? normalizeRepo(repo, defaultOwner) : null,
  );
  if (parsed.some((repo) => repo === null))
    throw new ValidationError("Repos must look like owner/repo");
  return {
    agentId: text(body, "agentId", { required: true, max: 200 }),
    repos: [...new Set(parsed as string[])],
    message: text(body, "message", { required: true }),
    title: text(body, "title", { max: 200 }),
  };
}

export function parseMessage(raw: unknown): string {
  return text(asObject(raw), "text", { required: true });
}

export function parseConfirmation(raw: unknown): {
  toolUseId: string;
  allow: boolean;
  denyMessage: string;
} {
  const body = asObject(raw);
  if (typeof body.allow !== "boolean") throw new ValidationError("allow must be true or false");
  return {
    toolUseId: text(body, "toolUseId", { required: true, max: 200 }),
    allow: body.allow,
    denyMessage: text(body, "denyMessage", { max: 2000 }),
  };
}

export function parseRunFilter(params: URLSearchParams): RunFilter {
  const status = params.get("status");
  const agentId = params.get("agent");
  return {
    ...(agentId ? { agentId } : {}),
    ...(status && RUN_STATUSES.includes(status as RunStatus)
      ? { status: status as RunStatus }
      : {}),
  };
}
