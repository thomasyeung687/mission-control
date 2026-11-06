import type { AgentSummary } from "@/lib/types";

const REPO_NOTE =
  "You work on Golf, a React Native (Expo) app in thomasyeung687/golf-native. Keep changes small and explain trade-offs briefly.";

function agent(
  id: string,
  name: string,
  description: string,
  role: string,
  extra: Partial<AgentSummary> = {},
): AgentSummary {
  return {
    id,
    name,
    description,
    system: `${role}\n\n${REPO_NOTE}`,
    model: "claude-opus-5-5",
    version: 3,
    webAccess: false,
    permission: "auto",
    updatedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    ...extra,
  };
}

export function fixtureAgents(): AgentSummary[] {
  return [
    agent(
      "agent_mock_designer",
      "Designer",
      "Screens, flows and the design system",
      "You are the product designer. You propose UI changes as concrete component code and annotated screenshots.",
      { webAccess: true, version: 5 },
    ),
    agent(
      "agent_mock_engineer",
      "Engineer",
      "Implements features and fixes bugs",
      "You are a senior mobile engineer. You implement features end to end, with tests, and open a branch per change.",
      { version: 8 },
    ),
    agent(
      "agent_mock_qa",
      "QA",
      "Test plans, Detox suites and regressions",
      "You are the QA engineer. You write and run tests, reproduce bugs, and report findings with exact steps.",
    ),
    agent(
      "agent_mock_reviewer",
      "Reviewer",
      "Reviews branches before they merge",
      "You are a strict code reviewer. You read diffs carefully, run the checks, and leave actionable comments.",
      { permission: "always_ask", version: 2 },
    ),
  ];
}
