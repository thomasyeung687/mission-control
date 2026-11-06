import type { PermissionPolicy } from "@/lib/types";

export const DEFAULT_MODEL = "claude-opus-5-5";

export const MODEL_OPTIONS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
  { id: "claude-fable-5-1", label: "Claude Fable 5.1" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
] as const;

export const PERMISSION_OPTIONS: ReadonlyArray<{ id: PermissionPolicy; label: string }> = [
  { id: "auto", label: "Auto — risky calls pause for you" },
  { id: "always_ask", label: "Always ask before each tool call" },
  { id: "always_allow", label: "Always allow" },
];

export function toolsetConfig(webAccess: boolean, permission: PermissionPolicy) {
  return {
    type: "agent_toolset_20260401" as const,
    default_config: { enabled: true, permission_policy: { type: permission } },
    configs: [
      { name: "web_fetch" as const, enabled: webAccess },
      { name: "web_search" as const, enabled: webAccess },
    ],
  };
}

interface ToolsetLike {
  type: string;
  default_config?: { permission_policy?: { type: string } };
  configs?: ReadonlyArray<{ name: string; enabled?: boolean | null }>;
}

export function readToolset(tools: readonly ToolsetLike[]): {
  webAccess: boolean;
  permission: PermissionPolicy;
} {
  const toolset = tools.find((tool) => tool.type === "agent_toolset_20260401");
  const policy = toolset?.default_config?.permission_policy?.type;
  const web = toolset?.configs?.find((config) => config.name === "web_search");
  return {
    webAccess: web ? web.enabled !== false : !!toolset,
    permission: policy === "always_ask" || policy === "always_allow" ? policy : "auto",
  };
}
