# Mission Control

A personal web dashboard for creating, monitoring and chatting with long-running Claude agents, built on
Anthropic's [Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview) API (beta).

- **Agents** — list, create and edit agents (name, role/system prompt, model, tool approvals, web access).
  Every save creates a new agent version; running sessions keep the version they started with.
- **Runs** — every session with its agent, repos, status (running / waiting on you / idle / ended) and last
  activity, filterable by agent and status.
- **New run** — pick an agent, one or more GitHub repos (mounted into the sandbox with the server's
  `GITHUB_TOKEN`) and the first message.
- **Run view** — a live chat: agent messages in full, tool calls as one expandable line each, messages you
  send queue while the agent works, an Interrupt button, and Allow/Deny cards when a tool call needs you.
  The stream reconnects without losing events.
- **Needs you** — runs waiting on your approval, plus runs that finished since you last opened them.

Keys stay on the server: the browser only talks to this app's route handlers.

## Setup

Requires Node.js 20+.

```sh
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable                   | What it is                                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`        | Create one at [console.anthropic.com](https://console.anthropic.com) → **API keys**. API usage is billed per token to that Console organization; it is separate from a Claude.ai Pro/Max subscription.                                                                                                                                            |
| `GITHUB_TOKEN`             | A [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) limited to the repos agents should work on, with **Contents: Read and write** (read-only is enough if agents should never push). It is sent to Anthropic as the repo's `authorization_token` and never enters the agent's sandbox or your browser. |
| `MISSION_CONTROL_PASSWORD` | The password for the dashboard login.                                                                                                                                                                                                                                                                                                             |

Optional: `MISSION_CONTROL_SECRET` (cookie signing secret, defaults to the password),
`MISSION_CONTROL_ENVIRONMENT_ID` (use an existing environment instead of the auto-created one),
`GITHUB_DEFAULT_OWNER` (so `golf-native` means `thomasyeung687/golf-native`), `MISSION_CONTROL_REPOS`
(repo suggestions on the New run form) and `ANTHROPIC_WORKSPACE_ID` (for the "Console ↗" link on a run).

On the first run it starts, Mission Control creates a Managed Agents environment named `mission-control`
(cloud container, limited networking with package managers allowed) and reuses it afterwards. If agents
need to reach other hosts, create an environment with the access they need and set
`MISSION_CONTROL_ENVIRONMENT_ID`.

## Running locally

```sh
npm run dev
```

Open http://localhost:3000 and sign in with `MISSION_CONTROL_PASSWORD`. Create your agents on the Agents page
(the role buttons prefill Designer, Engineer, QA and Reviewer), then start a run.

To use it from a phone on the same network, open `http://<your-computer's-LAN-IP>:3000`. Add it to the home
screen from Safari's share sheet for a full-screen app.

## Mock mode

`MOCK=1` replaces the Anthropic API with built-in fixtures: four agents, six runs in every status, and a
simulated agent that streams replies, runs tools, waits for approval and responds to interrupts. No keys
needed — only `MISSION_CONTROL_PASSWORD`.

```sh
MOCK=1 MISSION_CONTROL_PASSWORD=dev-password npm run dev
```

Mock state lives in memory and resets when the server restarts.

## Checks

```sh
scripts/verify.sh   # Prettier, ESLint (zero warnings), tsc --noEmit, Vitest, next build
```

The same script runs in GitHub Actions on every push and pull request.

With a mock-mode server running on port 3000:

```sh
npm run smoke        # Playwright: login, approve, send, interrupt, new run, new agent, filters
npm run screenshots  # saves desktop and phone screenshots, light and dark, to screenshots/
```

Both use the Playwright installed globally (`npm root -g`).

## How it works

- `src/lib/backend/` — one `Backend` interface with two implementations: `live/` (the official
  `@anthropic-ai/sdk`, `client.beta.agents / environments / sessions`) and `mock/`.
- `src/app/api/runs/[id]/stream` — opens the session's event stream first, then replays the event history
  and drops duplicates, and forwards both to the browser as Server-Sent Events. If the connection drops, the
  browser reconnects and the same replay fills the gap.
- `src/lib/run/` — pure logic with unit tests: the event reducer that turns events into chat items, status
  derivation, and the inbox rules. "Last looked at" is stored in the session's metadata (`mc_seen_at`), so it
  is the same on every device.
- `src/proxy.ts` — every page and API route requires the signed, httpOnly login cookie.

## Deploying later

Any Node host that keeps a long-lived HTTP response open works (the run view streams over SSE). Set the
same environment variables, use a long random `MISSION_CONTROL_SECRET`, and serve over HTTPS — the login
cookie is marked `Secure` in production.
