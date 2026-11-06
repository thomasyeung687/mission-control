"use client";

import { useState } from "react";
import type { ToolItem } from "@/lib/run/chat-items";
import { summarizeToolInput } from "@/lib/run/text";
import styles from "./Chat.module.css";

const OUTCOME_ICON: Record<string, string> = { ok: "✓", error: "✕", denied: "⊘", pending: "…" };
const RESULT_PREVIEW = 4000;

function outcomeOf(tool: ToolItem): { icon: string; label: string; className: string } {
  if (tool.permission === "ask" && tool.confirmation === null && tool.outcome === "pending") {
    return { icon: "?", label: "Needs approval", className: styles.toolAsk ?? "" };
  }
  const labels = { ok: "Done", error: "Failed", denied: "Denied", pending: "Running" };
  return {
    icon: OUTCOME_ICON[tool.outcome] ?? "…",
    label: labels[tool.outcome],
    className: styles[`tool_${tool.outcome}`] ?? "",
  };
}

export function ToolCallRow({ tool }: { tool: ToolItem }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const outcome = outcomeOf(tool);
  const result = tool.result ?? "";
  const shown = full ? result : result.slice(0, RESULT_PREVIEW);
  return (
    <div className={`${styles.tool} ${outcome.className}`}>
      <button
        type="button"
        className={styles.toolLine}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={styles.toolIcon} title={outcome.label} aria-label={outcome.label}>
          {outcome.icon}
        </span>
        <span className={styles.toolName}>
          {tool.server ? `${tool.server}.` : ""}
          {tool.name}
        </span>
        <span className={styles.toolSummary}>{summarizeToolInput(tool.input)}</span>
        <span className={styles.chevron} aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div className={styles.toolBody}>
          <div className={styles.toolLabel}>Input</div>
          <pre>{JSON.stringify(tool.input, null, 2)}</pre>
          {tool.custom ? (
            <p className={styles.toolNote}>
              Custom tool — Mission Control can’t answer custom tool calls.
            </p>
          ) : null}
          {tool.result !== null ? (
            <>
              <div className={styles.toolLabel}>Result</div>
              <pre>{shown || "(empty)"}</pre>
              {result.length > RESULT_PREVIEW && !full ? (
                <button type="button" className={styles.linkButton} onClick={() => setFull(true)}>
                  Show all {result.length.toLocaleString()} characters
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
