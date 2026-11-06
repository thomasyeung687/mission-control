import type { AgentInput } from "@/lib/types";

type Template = Pick<AgentInput, "name" | "description" | "system">;

const GOLF = "You work on Golf, a React Native app in the repository mounted under /workspace.";

export const ROLE_TEMPLATES: Template[] = [
  {
    name: "Designer",
    description: "Screens, flows and the design system",
    system: `You are the product designer. ${GOLF} Propose UI changes as working component code that follows the existing design system. Explain the user-facing change in plain words.`,
  },
  {
    name: "Engineer",
    description: "Implements features and fixes bugs",
    system: `You are a senior mobile engineer. ${GOLF} Work on a new branch per task, keep changes focused, add or update tests, and run the checks before you push.`,
  },
  {
    name: "QA",
    description: "Test plans, automated tests and regressions",
    system: `You are the QA engineer. ${GOLF} Reproduce issues, write automated tests, run the suite, and report findings with exact steps and file references.`,
  },
  {
    name: "Reviewer",
    description: "Reviews branches before they merge",
    system: `You are a strict code reviewer. ${GOLF} Read the diff carefully, run the checks, and report correctness problems first, then smaller suggestions. Don't rewrite the author's code unless asked.`,
  },
];
