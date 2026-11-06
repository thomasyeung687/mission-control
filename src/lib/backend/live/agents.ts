import "server-only";
import type { BetaManagedAgentsAgent } from "@anthropic-ai/sdk/resources/beta/agents/agents";
import { readToolset, toolsetConfig } from "@/lib/agent-config";
import type { AgentInput, AgentSummary } from "@/lib/types";
import { anthropic } from "./client";

export function toAgentSummary(agent: BetaManagedAgentsAgent): AgentSummary {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    system: agent.system,
    model: agent.model.id,
    version: agent.version,
    updatedAt: agent.updated_at,
    ...readToolset(agent.tools),
  };
}

function agentParams(input: AgentInput) {
  return {
    name: input.name,
    description: input.description || null,
    system: input.system || null,
    model: input.model,
    tools: [toolsetConfig(input.webAccess, input.permission)],
  };
}

export async function listAgents(): Promise<AgentSummary[]> {
  const agents: AgentSummary[] = [];
  for await (const agent of anthropic().beta.agents.list()) {
    if (!agent.archived_at) agents.push(toAgentSummary(agent));
  }
  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAgent(id: string): Promise<AgentSummary> {
  return toAgentSummary(await anthropic().beta.agents.retrieve(id));
}

export async function createAgent(input: AgentInput): Promise<AgentSummary> {
  return toAgentSummary(await anthropic().beta.agents.create(agentParams(input)));
}

export async function updateAgent(id: string, input: AgentInput): Promise<AgentSummary> {
  const params = { ...agentParams(input), version: input.version };
  return toAgentSummary(await anthropic().beta.agents.update(id, params));
}
