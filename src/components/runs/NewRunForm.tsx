"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ui from "@/components/ui.module.css";
import { messageOf, sendJson } from "@/lib/client-api";
import type { AgentSummary, RunSummary } from "@/lib/types";
import { RepoInput } from "./RepoInput";

interface Props {
  agents: AgentSummary[];
  initialAgentId?: string;
  suggestedRepos: string[];
}

export function NewRunForm({ agents, initialAgentId, suggestedRepos }: Props) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(initialAgentId ?? agents[0]?.id ?? "");
  const [repos, setRepos] = useState<string[]>(suggestedRepos.slice(0, 1));
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const run = await sendJson<RunSummary>("/api/runs", { agentId, repos, title, message });
      router.push(`/runs/${run.id}`);
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={ui.panel} style={{ padding: 20 }}>
      {error ? <p className={ui.error}>{error}</p> : null}
      <label className={ui.field}>
        <span className={ui.label}>Agent</span>
        <select
          className={ui.input}
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          required
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
              {agent.description ? ` — ${agent.description}` : ""}
            </option>
          ))}
        </select>
      </label>
      <RepoInput repos={repos} onChange={setRepos} suggestions={suggestedRepos} />
      <label className={ui.field}>
        <span className={ui.label}>Title</span>
        <input
          className={ui.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Optional — defaults to the first line of the message"
          maxLength={200}
        />
      </label>
      <label className={ui.field}>
        <span className={ui.label}>First message</span>
        <textarea
          className={ui.input}
          rows={7}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What should the agent do?"
          required
        />
      </label>
      <button
        type="submit"
        className={`${ui.button} ${ui.primary}`}
        disabled={busy || !agentId || !message.trim()}
      >
        {busy ? "Starting…" : "Start run"}
      </button>
    </form>
  );
}
