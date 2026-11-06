import "server-only";
import { anthropic } from "./client";

const ENVIRONMENT_NAME = "mission-control";
let cached: Promise<string> | null = null;

async function findOrCreate(): Promise<string> {
  const configured = process.env.MISSION_CONTROL_ENVIRONMENT_ID;
  if (configured) return configured;
  const client = anthropic();
  for await (const env of client.beta.environments.list()) {
    if (env.name === ENVIRONMENT_NAME && !env.archived_at) return env.id;
  }
  const created = await client.beta.environments.create({
    name: ENVIRONMENT_NAME,
    description: "Sandbox for runs started from Mission Control",
    config: {
      type: "cloud",
      networking: { type: "limited", allow_package_managers: true, allow_mcp_servers: true },
    },
  });
  return created.id;
}

export function environmentId(): Promise<string> {
  cached ??= findOrCreate().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}
