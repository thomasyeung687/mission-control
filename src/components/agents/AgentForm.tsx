"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ui from "@/components/ui.module.css";
import { DEFAULT_MODEL, MODEL_OPTIONS, PERMISSION_OPTIONS } from "@/lib/agent-config";
import { messageOf, sendJson } from "@/lib/client-api";
import type { AgentInput, AgentSummary, PermissionPolicy } from "@/lib/types";
import { ROLE_TEMPLATES } from "./templates";

function initialInput(agent?: AgentSummary): AgentInput {
  return {
    name: agent?.name ?? "",
    description: agent?.description ?? "",
    system: agent?.system ?? "",
    model: agent?.model ?? DEFAULT_MODEL,
    webAccess: agent?.webAccess ?? false,
    permission: agent?.permission ?? "auto",
    ...(agent ? { version: agent.version } : {}),
  };
}

export function AgentForm({ agent }: { agent?: AgentSummary }) {
  const router = useRouter();
  const [input, setInput] = useState<AgentInput>(() => initialInput(agent));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof AgentInput>(key: K, value: AgentInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));
  const models = MODEL_OPTIONS.some((m) => m.id === input.model)
    ? MODEL_OPTIONS
    : [...MODEL_OPTIONS, { id: input.model, label: input.model }];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (agent) await sendJson(`/api/agents/${agent.id}`, input, "PUT");
      else await sendJson("/api/agents", input);
      router.push("/agents");
      router.refresh();
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={ui.panel} style={{ padding: 20 }}>
      {error ? <p className={ui.error}>{error}</p> : null}
      {!agent ? (
        <div className={ui.field}>
          <span className={ui.label}>Start from a role</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ROLE_TEMPLATES.map((role) => (
              <button
                key={role.name}
                type="button"
                className={`${ui.button} ${ui.small}`}
                onClick={() => setInput((prev) => ({ ...prev, ...role }))}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <label className={ui.field}>
        <span className={ui.label}>Name</span>
        <input
          className={ui.input}
          value={input.name}
          onChange={(e) => set("name", e.target.value)}
          required
          maxLength={256}
        />
      </label>
      <label className={ui.field}>
        <span className={ui.label}>Description</span>
        <input
          className={ui.input}
          value={input.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={2048}
        />
      </label>
      <label className={ui.field}>
        <span className={ui.label}>Role (system prompt)</span>
        <textarea
          className={ui.input}
          rows={10}
          value={input.system}
          onChange={(e) => set("system", e.target.value)}
        />
      </label>
      <label className={ui.field}>
        <span className={ui.label}>Model</span>
        <select
          className={ui.input}
          value={input.model}
          onChange={(e) => set("model", e.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
      </label>
      <label className={ui.field}>
        <span className={ui.label}>Tool approvals</span>
        <select
          className={ui.input}
          value={input.permission}
          onChange={(e) => set("permission", e.target.value as PermissionPolicy)}
        >
          {PERMISSION_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={ui.hint}>
          Applies to the standard toolset: bash, read, write, edit, glob, grep and web tools.
        </span>
      </label>
      <label className={ui.field} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={input.webAccess}
          onChange={(e) => set("webAccess", e.target.checked)}
        />
        <span>Allow web search and web fetch</span>
      </label>
      <button type="submit" className={`${ui.button} ${ui.primary}`} disabled={busy}>
        {busy ? "Saving…" : agent ? `Save as version ${agent.version + 1}` : "Create agent"}
      </button>
    </form>
  );
}
