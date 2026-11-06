# Mission Control

How Thomas runs a small team of Claude agents on his **Claude plan**, with no Anthropic API key.

- **Teammates** are Claude Code cloud sessions (claude.ai/code): a Designer, an Engineer, QA and a Reviewer,
  working on [golf-native](https://github.com/thomasyeung687/golf-native).
- **A chief-of-staff session** starts them, sends them work and checks on them with Claude Code's own remote
  session tools. Teammates report back to it.
- **The dashboard** is a private claude.ai page the chief of staff publishes and keeps current: who is
  working on what, what's waiting on Thomas, and an "Open chat" link for each teammate.
- **Thomas** talks to the chief of staff, or to any teammate directly, in the Claude app.

## What's here

| Path                                                             | What it is                                                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [`PLAYBOOK.md`](PLAYBOOK.md)                                     | How the chief of staff starts, briefs, checks on and archives teammates, and updates the dashboard. Also the limits.                  |
| [`team/`](team/)                                                 | One file per teammate: role, repos, opening instructions, what it hands back, tags.                                                   |
| [`dashboard/index.html`](dashboard/index.html)                   | The dashboard page. One HTML file; works on a phone; light and dark.                                                                  |
| [`dashboard/roster.example.json`](dashboard/roster.example.json) | Sample of the roster the page reads. The live `roster.json` is kept by the chief of staff and published with the page, not committed. |

## Getting started

1. In the Claude app, start a Claude Code session on this repo and paste the opening instructions from
   [`team/chief-of-staff.md`](team/chief-of-staff.md). That session is the chief of staff.
2. Tell it what you want done on the Golf app. It starts the teammates it needs, following the playbook.
3. Ask it for the dashboard link and pin it. Open any teammate's chat from there.

To preview the dashboard locally: `cd dashboard && python3 -m http.server`, then open
http://localhost:8000. With no `roster.json` it shows the sample roster.

## Limits

Teammates can't use a computer or the iOS simulator unless a session is connected to a folder Thomas
shares from his Mac through Remote Control. Every session shares the same plan usage limits. Details in
the [playbook](PLAYBOOK.md#limits).

## The earlier version

The first version of Mission Control was a Next.js dashboard built on the Managed Agents API, which needs
an Anthropic API key billed per token. It is kept, unchanged, on the
[`archive/api-key-dashboard`](https://github.com/thomasyeung687/mission-control/tree/archive/api-key-dashboard)
branch.
